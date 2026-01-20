#!/bin/bash

# Git Push Decline Diagnostic Script
# "Something is rotten in the state of Denmark" - Hamlet

set -e

# Colors for dramatic effect
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
REPO_OWNER="mojomaxme"
REPO_NAME="mojobus"
GIT_REMOTE="origin"
GIT_BRANCH="main"

echo -e "${CYAN}🎭 Git Push Decline Diagnostic${NC}"
echo -e "${CYAN}===================================${NC}"
echo ""

# Function: Check repository connection
check_repository_connection() {
    echo -e "${YELLOW}🔍 Checking repository connection...${NC}"
    
    # Check if GitHub is reachable
    if curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME" > /dev/null; then
        echo -e "${GREEN}✅ GitHub repository reachable${NC}"
        echo -e "${GREEN}🌐 Repository: https://github.com/$REPO_OWNER/$REPO_NAME${NC}"
    else
        echo -e "${RED}❌ Cannot reach GitHub repository${NC}"
        echo -e "${RED}💡 Check internet connection or repository name${NC}"
        return 1
    fi
    
    # Check git remote
    if git remote get-url "$GIT_REMOTE" > /dev/null 2>&1; then
        REMOTE_URL=$(git remote get-url "$GIT_REMOTE")
        echo -e "${GREEN}✅ Git remote configured: $GIT_REMOTE${NC}"
        echo -e "${GREEN}🔗 Remote URL: $REMOTE_URL${NC}"
    else
        echo -e "${RED}❌ No git remote '$GIT_REMOTE' found${NC}"
        echo -e "${YELLOW}💡 Add remote: git remote add $GIT_REMOTE https://github.com/$REPO_OWNER/$REPO_NAME.git${NC}"
        return 1
    fi
    
    return 0
}

# Function: Check local git status
check_local_status() {
    echo -e "${YELLOW}📊 Checking local git status...${NC}"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Not in a git repository${NC}"
        echo -e "${YELLOW}💡 Run: git init${NC}"
        return 1
    fi
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${GREEN}✅ You have uncommitted changes${NC}"
        echo -e "${BLUE}📝 Status:${NC}"
        git status --porcelain
        echo ""
    else
        echo -e "${YELLOW}ℹ️  No uncommitted changes${NC}"
    fi
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo -e "${GREEN}✅ Current branch: $CURRENT_BRANCH${NC}"
    
    # Check ahead/behind status
    if git rev-parse --verify "$GIT_REMOTE/$GIT_BRANCH" >/dev/null 2>&1; then
        AHEADS=$(git rev-list --count "$GIT_REMOTE/$GIT_BRANCH..HEAD")
        BEHINDS=$(git rev-list --count "HEAD..$GIT_REMOTE/$GIT_BRANCH")
        
        if [ "$AHEADS" -gt 0 ]; then
            echo -e "${GREEN}✅ You are $AHEADS commits ahead of remote${NC}"
        fi
        
        if [ "$BEHINDS" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  You are $BEHINDS commits behind remote${NC}"
        fi
    fi
    
    return 0
}

# Function: Check authentication
check_authentication() {
    echo -e "${YELLOW}🔐 Checking authentication...${NC}"
    
    # Check SSH authentication
    if ssh -T git@github.com 2>/dev/null; then
        echo -e "${GREEN}✅ SSH authentication working${NC}"
        AUTH_TYPE="SSH"
    else
        echo -e "${RED}❌ SSH authentication failed${NC}"
        AUTH_TYPE="FAILED"
    fi
    
    # Check if repository is private
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://github.com/$REPO_OWNER/$REPO_NAME")
    if [ "$HTTP_STATUS" = "404" ]; then
        echo -e "${RED}❌ Repository is private or doesn't exist${NC}"
        REPO_TYPE="PRIVATE"
    else
        echo -e "${GREEN}✅ Repository is accessible${NC}"
        REPO_TYPE="PUBLIC"
    fi
    
    echo -e "${BLUE}🔑 Auth Type: $AUTH_TYPE${NC}"
    echo -e "${BLUE}📁 Repository Type: $REPO_TYPE${NC}"
    
    if [ "$AUTH_TYPE" = "FAILED" ] && [ "$REPO_TYPE" = "PRIVATE" ]; then
        echo -e "${RED}❌ Cannot push - Authentication failed and repository is private${NC}"
        return 1
    fi
    
    return 0
}

# Function: Test push
test_push() {
    echo -e "${YELLOW}🚀 Testing push capabilities...${NC}"
    
    # Create a test commit if needed
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${BLUE}📝 Creating test commit...${NC}"
        echo "$(date): 🧪 Test commit for diagnostic" > test-diagnostic.txt
        git add test-diagnostic.txt
        git commit -m "🧪 Test commit for push diagnostic"
    fi
    
    # Test push with --dry-run
    echo -e "${BLUE}🧪 Testing push with --dry-run...${NC}"
    if git push --dry-run "$GIT_REMOTE" "$GIT_BRANCH" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Push --dry-run successful${NC}"
        PUSH_TEST="DRY_RUN_OK"
    else
        echo -e "${RED}❌ Push --dry-run failed${NC}"
        PUSH_TEST="DRY_RUN_FAILED"
    fi
    
    # Remove test commit
    git reset --hard HEAD~1 2>/dev/null || true
    
    return 0
}

# Function: Analyze recent commits
analyze_commits() {
    echo -e "${YELLOW}📚 Analyzing recent commits...${NC}"
    
    # Get last 5 commits
    echo -e "${BLUE}📜 Last 5 commits:${NC}"
    git log --oneline -5 --pretty=format:"%h | %s | %an (%ar)" | while read line; do
        HASH=$(echo "$line" | awk '{print $1}')
        SUBJECT=$(echo "$line" | cut -d' ' -f2- | sed 's/^...//')
        AUTHOR=$(echo "$line" | awk '{print $NF}')
        DATE=$(echo "$line" | sed "s/.*(\([^)]*).*/\1/")
        
        echo -e "${CYAN}📝 $HASH${NC} ${WHITE}$SUBJECT${NC} ${YELLOW}by $AUTHOR${NC} ${GREEN}($DATE)${NC}"
    done
    echo ""
    
    # Check for large files
    echo -e "${BLUE}📦 Checking for large files...${NC}"
    git ls-tree -r --name-only HEAD | while read file; do
        if [ -f "$file" ]; then
            SIZE=$(du -h "$file" | cut -f1)
            if [ "${SIZE: -1}" -gt "M" ]; then
                echo -e "${RED}❗  Large file detected: $file ($SIZE)${NC}"
            fi
        fi
    done
}

# Function: Provide solutions
provide_solutions() {
    echo -e "${PURPLE}🎯 Solutions for 'push failed - declined':${NC}"
    echo -e "${PURPLE}==========================================${NC}"
    echo ""
    
    echo -e "${GREEN}1️⃣ PROTECTED BRANCH (95% probability):${NC}"
    echo -e "${YELLOW}   Repository settings → Branches → main → Restrict pushes${NC}"
    echo -e "${CYAN}   💡 Solution 1: Make a Pull Request${NC}"
    echo -e "${CYAN}   💡 Solution 2: Temporarily disable restrictions${NC}"
    echo ""
    
    echo -e "${GREEN}2️⃣ FAILED STATUS CHECKS (80% probability):${NC}"
    echo -e "${YELLOW}   CI/CD failed - check GitHub Actions tab${NC}"
    echo -e "${CYAN}   💡 Solution: Fix failing tests or skip status checks${NC}"
    echo ""
    
    echo -e "${GREEN}3️⃣ LARGE FORBIDDEN FILES (5% probability):${NC}"
    echo -e "${YELLOW}   Files >100MB or .exe, .dll, etc.${NC}"
    echo -e "${CYAN}   💡 Solution: Use Git LFS or .gitignore${NC}"
    echo ""
    
    echo -e "${GREEN}4️⃣ GITHUB ACTION/HOOK (5% probability):${NC}"
    echo -e "${YELLOW}   Server-side hook rejected the push${NC}"
    echo -e "${CYAN}   💡 Solution: Check repository hooks in Settings${NC}"
    echo ""
}

# Function: Immediate actions
immediate_actions() {
    echo -e "${RED}🚨 IMMEDIATE ACTIONS:${NC}"
    echo -e "${RED}==================${NC}"
    echo ""
    
    if [ "$AUTH_TYPE" = "FAILED" ]; then
        echo -e "${WHITE}1. 🔐 Fix SSH authentication:${NC}"
        echo -e "${YELLOW}   ssh-keygen -t ed25519 -C \"your-email@mojobus.cc\"${NC}"
        echo -e "${YELLOW}   cat ~/.ssh/id_ed25519.pub | pbcopy${NC}"
        echo -e "${YELLOW}   Add to GitHub Settings → SSH and GPG keys${NC}"
    fi
    
    if [ "$REPO_TYPE" = "PRIVATE" ]; then
        echo -e "${WHITE}2. 🔑 Check repository access:${NC}"
        echo -e "${YELLOW}   Ensure you have write access to the repository${NC}"
    fi
    
    echo -e "${WHITE}3. 🌐 Open repository settings:${NC}"
        echo -e "${YELLOW}   https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}💡 QUICK FIXES:${NC}"
    echo -e "${WHITE}   Option A: ${CYAN}git checkout -b fix-deploy && git push origin fix-deploy${NC}"
    echo -e "${WHITE}   Option B: ${CYAN}git push origin main --force-with-lease${NC} (dangerous!)${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${CYAN}🎭 Git Push Decline Diagnostic${NC}"
    echo -e "${CYAN}=================================${NC}"
    echo -e "${BLUE}Repository: $REPO_OWNER/$REPO_NAME${NC}"
    echo -e "${BLUE}Remote: $GIT_REMOTE${NC}"
    echo -e "${BLUE}Branch: $GIT_BRANCH${NC}"
    echo ""
    
    # Check all conditions
    if ! check_repository_connection; then
        echo -e "${RED}❌ Repository connection failed${NC}"
        immediate_actions
        exit 1
    fi
    
    if ! check_local_status; then
        echo -e "${RED}❌ Local git status check failed${NC}"
        immediate_actions
        exit 1
    fi
    
    if ! check_authentication; then
        echo -e "${RED}❌ Authentication check failed${NC}"
        immediate_actions
        exit 1
    fi
    
    test_push
    analyze_commits
    provide_solutions
    
    echo -e "${GREEN}🎉 Diagnostic completed!${NC}"
    echo -e "${GREEN}===================${NC}"
    echo ""
}

# Run main function
main "$@"