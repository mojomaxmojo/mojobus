#!/bin/bash

# Shakespeare's Git Push Solution
# "To push, or not to push, that is the question" - Hamlet, Act 3, Scene 1

set -e  # "All that glisters is not gold" - Merchant of Venice

# Colors for drama
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
GIT_REPO="mojomaxme/mojobus"
GIT_BRANCH="main"
COMMIT_PREFIX="deploy:"

# Bard's wisdom
echo -e "${CYAN}🎭 Shakespeare's Git Push Solution${NC}"
echo -e "${CYAN}====================================${NC}"
echo ""

# Function: Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check git installation
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git not found! Installing...${NC}"
        if command -v dnf &> /dev/null; then
            sudo dnf install -y git-all
        elif command -v yum &> /dev/null; then
            sudo yum install -y git-all
        else
            echo -e "${RED}❌ Cannot install git automatically${NC}"
            exit 1
        fi
    else
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        echo -e "${GREEN}✅ Git found: $GIT_VERSION${NC}"
    fi
    
    # Check SSH connection to GitHub
    echo -e "${YELLOW}🔗 Testing GitHub connection...${NC}"
    if ssh -T git@github.com 2>/dev/null; then
        echo -e "${GREEN}✅ GitHub SSH connection working${NC}"
    else
        echo -e "${RED}❌ GitHub SSH connection failed!${NC}"
        echo -e "${YELLOW}💡 Please add your SSH key to GitHub${NC}"
        echo -e "${YELLOW}   1. ssh-keygen -t ed25519 -C \"your-email@mojobus.cc\"${NC}"
        echo -e "${YELLOW}   2. cat ~/.ssh/id_ed25519.pub${NC}"
        echo -e "${YELLOW}   3. Add to GitHub Settings > SSH and GPG keys${NC}"
        exit 1
    fi
    
    # Check if in git repository
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Not in a git repository!${NC}"
        echo -e "${YELLOW}💡 Run: git init${NC} (new repo) or git clone <repo>${NC} (existing repo)"
        exit 1
    fi
    
    # Check remote configuration
    if ! git remote get-url origin &>/dev/null; then
        echo -e "${RED}❌ No remote 'origin' configured!${NC}"
        echo -e "${YELLOW}💡 Run: git remote add origin https://github.com/$GIT_REPO.git${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites satisfied${NC}"
    echo ""
}

# Function: Show git status
show_status() {
    echo -e "${BLUE}📊 Repository Status${NC}"
    echo -e "${BLUE}==================${NC}"
    git status --porcelain --branch
    git log --oneline -5 --graph --decorate
    echo ""
}

# Function: Stage changes
stage_changes() {
    echo -e "${YELLOW}📝 Staging changes...${NC}"
    git add .
    STAGED=$(git diff --cached --name-only)
    if [ -z "$STAGED" ]; then
        echo -e "${YELLOW}ℹ️ No changes to stage${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ Staged ${#STAGED} files${NC}"
    echo ""
    git status --porcelain --cached
    echo ""
}

# Function: Commit changes
commit_changes() {
    echo -e "${YELLOW}✍️ Committing changes...${NC}"
    
    # Generate commit message
    if [ -z "$1" ]; then
        COMMIT_MSG="$COMMIT_PREFIX Quick deployment update"
    else
        COMMIT_MSG="$COMMIT_PREFIX $1"
    fi
    
    echo -e "${CYAN}📝 Commit message: $COMMIT_MSG${NC}"
    git commit -m "$COMMIT_MSG"
    
    # Show commit details
    COMMIT_HASH=$(git rev-parse --short HEAD)
    echo -e "${GREEN}✅ Committed: $COMMIT_HASH${NC}"
    echo ""
}

# Function: Sync with remote
sync_with_remote() {
    echo -e "${YELLOW}🔄 Syncing with remote...${NC}"
    
    # Fetch latest changes
    git fetch origin
    
    # Check if we're behind
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$GIT_BRANCH)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}✅ Up to date with remote${NC}"
        return 0
    fi
    
    # Check if we're ahead
    if git merge-base --is-ancestor origin/$GIT_BRANCH HEAD &>/dev/null; then
        echo -e "${GREEN}✅ Local is ahead of remote${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Local is behind remote, pulling changes...${NC}"
        git pull origin $GIT_BRANCH --rebase
        return 1
    fi
}

# Function: Push to remote
push_to_remote() {
    echo -e "${YELLOW}🚀 Pushing to remote...${NC}"
    
    if [ "$1" = "--force" ]; then
        echo -e "${YELLOW}⚡️ Force pushing to remote...${NC}"
        git push origin $GIT_BRANCH --force
    else
        git push origin $GIT_BRANCH
    fi
    
    echo -e "${GREEN}✅ Successfully pushed to remote!${NC}"
    echo ""
}

# Function: Deploy with safety checks
safe_deploy() {
    echo -e "${PURPLE}🎭 Shakespeare's Safe Deployment${NC}"
    echo -e "${PURPLE}=================================${NC}"
    echo ""
    
    # Stage changes
    if ! stage_changes; then
        echo -e "${RED}❌ Nothing to deploy${NC}"
        exit 1
    fi
    
    # Commit changes
    commit_changes "$@"
    
    # Sync with remote
    sync_with_remote
    
    # Push changes
    push_to_remote "$@"
    
    # Success message
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${CYAN}🌐 Your changes are now live on GitHub!${NC}"
    echo -e "${CYAN}🔗 Repository: https://github.com/$GIT_REPO${NC}"
    echo ""
    
    # Next steps
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "${YELLOW}1. Check your deployment on GitHub${NC}"
    echo -e "${YELLOW}2. If using CI/CD, the pipeline will start automatically${NC}"
    echo -e "${YELLOW}3. If deploying manually, pull changes on your server${NC}"
    echo ""
}

# Function: Quick deploy (assumes everything is ready)
quick_deploy() {
    echo -e "${CYAN}⚡ Quick deploy (no safety checks)${NC}"
    echo ""
    
    git add .
    git commit -m "$COMMIT_PREFIX Quick update"
    git push origin $GIT_BRANCH
    
    echo -e "${GREEN}✅ Quick deploy completed!${NC}"
}

# Function: Interactive commit message
interactive_commit() {
    echo -e "${BLUE}📝 Interactive commit message${NC}"
    echo -e "${BLUE}==============================${NC}"
    echo ""
    echo "Enter your commit message (empty to abort):"
    read -r COMMIT_INPUT
    
    if [ -z "$COMMIT_INPUT" ]; then
        echo -e "${YELLOW}⏹️ Commit aborted${NC}"
        exit 1
    fi
    
    commit_changes "$COMMIT_INPUT"
}

# Main execution
main() {
    # Parse arguments
    case "${1:-safe}" in
        "status")
            show_status
            ;;
        "quick")
            quick_deploy
            ;;
        "force")
            echo -e "${RED}⚠️ Force mode - this will overwrite remote history!${NC}"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                safe_deploy "$@"
            else
                echo -e "${YELLOW}⏹️ Force deploy cancelled${NC}"
                exit 1
            fi
            ;;
        "commit")
            interactive_commit
            sync_with_remote
            push_to_remote
            ;;
        "help"|"-h"|"--help")
            echo -e "${CYAN}📖 Shakespeare's Git Push Helper${NC}"
            echo -e "${CYAN}Usage: $0 [command] [options]${NC}"
            echo ""
            echo -e "${CYAN}Commands:${NC}"
            echo -e "${CYAN}  safe    - Safe deployment with all checks${NC}"
            echo -e "${CYAN}  quick   - Quick deploy without checks${NC}"
            echo -e "${CYAN}  force   - Force push (overwrites history)${NC}"
            echo -e "${CYAN}  commit  - Interactive commit with custom message${NC}"
            echo -e "${CYAN}  status  - Show repository status${NC}"
            echo -e "${CYAN}  help    - Show this help message${NC}"
            echo ""
            echo -e "${CYAN}Examples:${NC}"
            echo -e "${CYAN}  $0 safe \"Add new deployment features\"${NC}"
            echo -e "${CYAN}  $0 quick${NC}"
            echo -e "${CYAN}  $0 force${NC}"
            echo ""
            exit 0
            ;;
        "safe"|*)
            safe_deploy "$@"
            ;;
    esac
}

# Run main function
main "$@"