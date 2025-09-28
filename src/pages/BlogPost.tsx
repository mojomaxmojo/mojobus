import { useSeoMeta } from '@unhead/react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft, Clock, Share2 } from 'lucide-react';
import { CommentsSection } from '@/components/comments/CommentsSection';

// Mock blog posts data (shared with Blog.tsx)
const blogPosts = [
  {
    id: 1,
    title: "The Future of Decentralized Social Media",
    excerpt: "Exploring how protocols like Nostr are revolutionizing the way we connect and share information online, creating a more open and censorship-resistant internet.",
    content: `
# The Future of Decentralized Social Media

The internet was born as a decentralized network, but over the past two decades, we've witnessed an unprecedented centralization of social media platforms. Today, a handful of corporations control how billions of people communicate, share information, and express themselves online.

## The Problem with Centralized Platforms

Traditional social media platforms suffer from several fundamental issues:

- **Censorship and Control**: Platforms can silence voices, remove content, and ban users without transparent processes
- **Data Ownership**: Users have no real control over their data or content
- **Algorithm Manipulation**: Engagement-driven algorithms often promote divisive content
- **Vendor Lock-in**: Moving your social graph to another platform is nearly impossible

## Enter Nostr: A New Paradigm

Nostr (Notes and Other Stuff Transmitted by Relays) represents a paradigm shift in social media architecture. Unlike traditional platforms, Nostr is:

### Truly Decentralized
There's no central server or company controlling the network. Anyone can run a relay, and users can connect to multiple relays simultaneously.

### Censorship Resistant
Since there's no central authority, no single entity can remove your content from the entire network. If one relay removes your content, it remains available on others.

### User-Owned Identity
Your identity is tied to cryptographic keys that you control, not to any platform. You own your followers, your content, and your digital identity.

## The Technical Foundation

Nostr's simplicity is its strength. The protocol consists of just two components:

1. **Clients**: Applications that users interact with to read and write data
2. **Relays**: Servers that store and forward messages

This minimalist approach makes the protocol incredibly robust and easy to implement.

## Looking Forward

As we move toward a more decentralized future, protocols like Nostr offer hope for a more open, censorship-resistant, and user-controlled internet. The journey is just beginning, but the foundation is solid.

The future of social media isn't about building bigger platforms—it's about building better protocols.
    `,
    author: "MK Fain",
    date: "2024-03-15",
    category: "Technology",
    tags: ["Nostr", "Decentralization", "Social Media"],
    image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=600&fit=crop&auto=format",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "Building Privacy-First Applications",
    excerpt: "A deep dive into creating applications that prioritize user privacy and data sovereignty, with practical examples and implementation strategies.",
    content: `
# Building Privacy-First Applications

In an era where data breaches make headlines weekly and surveillance capitalism dominates the digital landscape, building privacy-first applications isn't just a nice-to-have—it's an ethical imperative.

## Privacy by Design Principles

When building applications that respect user privacy, we must embed these principles from the ground up:

### Data Minimization
Collect only the data you absolutely need. Every piece of personal information you store is a liability—both for your users and your organization.

### Purpose Limitation
Use data only for the purposes you've explicitly stated. Don't repurpose user data for new features without clear consent.

### Transparency
Be clear about what data you collect, how you use it, and who you share it with. Privacy policies should be readable by humans, not just lawyers.

## Technical Strategies

### End-to-End Encryption
Implement encryption that ensures only the intended recipients can read messages or data. The server should never have access to plaintext content.

### Zero-Knowledge Architecture
Design systems where the service provider cannot access user data even if they wanted to. This protects users even from internal threats.

### Local-First Approach
Keep data on the user's device whenever possible. Sync only when necessary and encrypt data in transit and at rest.

## The Business Case for Privacy

Privacy isn't just about compliance—it's about building trust:

- **User Trust**: Privacy-respecting applications build stronger, more loyal user bases
- **Regulatory Compliance**: GDPR, CCPA, and other regulations make privacy a legal requirement
- **Competitive Advantage**: Privacy can be a key differentiator in crowded markets

## Implementation Examples

### Secure Authentication
- Use protocols like WebAuthn for passwordless authentication
- Implement proper session management with secure tokens
- Support hardware security keys for high-value accounts

### Data Handling
- Encrypt sensitive data using strong, modern encryption algorithms
- Implement proper key management and rotation
- Use secure deletion methods for data removal

## Conclusion

Building privacy-first applications requires thoughtful design, careful implementation, and ongoing vigilance. But the reward—user trust and a more ethical digital ecosystem—is worth the effort.

The future belongs to applications that empower users, not exploit them.
    `,
    author: "MK Fain",
    date: "2024-03-10",
    category: "Privacy",
    tags: ["Privacy", "Security", "Development"],
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=600&fit=crop&auto=format",
    readTime: "8 min read"
  },
  {
    id: 3,
    title: "The Philosophy of Open Source",
    excerpt: "Reflecting on the principles that drive open source development and how it creates a more collaborative and innovative technological landscape.",
    content: `
# The Philosophy of Open Source

Open source software represents more than just a development methodology—it's a philosophy that challenges traditional notions of ownership, collaboration, and innovation in the digital age.

## The Four Freedoms

The Free Software Foundation defines four essential freedoms that form the foundation of open source philosophy:

1. **Freedom to Run**: The freedom to run the program for any purpose
2. **Freedom to Study**: The freedom to study how the program works and change it
3. **Freedom to Redistribute**: The freedom to redistribute copies
4. **Freedom to Improve**: The freedom to distribute modified versions

## Beyond Code: A Cultural Movement

Open source extends far beyond software development. It represents a cultural shift toward:

### Transparency
Open source projects operate in the open, with visible development processes, public discussions, and transparent decision-making.

### Collaboration
The best solutions often emerge from diverse perspectives working together, rather than isolated teams working in silos.

### Meritocracy
Contributions are valued based on their merit, not on the contributor's title, company affiliation, or background.

## The Economics of Abundance

Traditional economics is based on scarcity—if I have something, you can't have it. Software breaks this model:

- Code can be copied infinitely without degrading the original
- Sharing knowledge increases its value rather than depleting it
- Collaboration creates more value than competition

## Challenges and Solutions

### The Sustainability Problem
Many open source projects struggle with funding and maintainer burnout. New models are emerging:

- **Corporate Sponsorship**: Companies supporting projects they depend on
- **Developer Funding**: Platforms like GitHub Sponsors and Open Collective
- **Dual Licensing**: Offering commercial licenses alongside open source ones

### Security Considerations
Open source's transparency can expose vulnerabilities, but it also enables:

- **Many Eyes Make Bugs Shallow**: More reviewers often mean faster bug discovery
- **Rapid Response**: Fixes can be deployed quickly across the ecosystem
- **No Security Through Obscurity**: Real security comes from strong design, not hidden code

## The Network Effect

Open source creates powerful network effects:

- More users lead to more contributors
- More contributors lead to better software
- Better software attracts more users

This creates a virtuous cycle that can make open source projects incredibly robust and innovative.

## Lessons for Life

The principles of open source extend beyond software:

- **Collaboration over Competition**: Working together often produces better results
- **Transparency builds Trust**: Open processes create stronger relationships
- **Shared Knowledge Benefits Everyone**: Teaching others strengthens the entire community

## Conclusion

Open source isn't just about making software free—it's about creating a more collaborative, transparent, and innovative world. As we face complex global challenges, the open source approach offers a model for working together toward common goals.

The future is open.
    `,
    author: "MK Fain",
    date: "2024-03-05",
    category: "Philosophy",
    tags: ["Open Source", "Philosophy", "Community"],
    image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200&h=600&fit=crop&auto=format",
    readTime: "6 min read"
  },
  {
    id: 4,
    title: "Sustainable Technology Practices",
    excerpt: "Examining how we can build technology that's not just innovative, but also environmentally conscious and sustainable for future generations.",
    content: `
# Sustainable Technology Practices

As our world becomes increasingly digital, the environmental impact of technology can no longer be ignored. From energy-hungry data centers to the rare earth minerals in our devices, the tech industry has a responsibility to build more sustainably.

## The Hidden Environmental Cost

Every click, every swipe, every video stream has an environmental footprint:

### Data Centers and Energy Consumption
- Data centers consume about 1% of global electricity
- AI training can emit as much CO2 as five cars over their lifetimes
- Video streaming accounts for over 1% of global emissions

### Device Manufacturing
- Rare earth mining devastates local ecosystems
- Manufacturing a smartphone produces 70kg of CO2
- E-waste is the fastest-growing waste stream globally

## Sustainable Development Practices

### Code Efficiency
Writing efficient code isn't just good practice—it's environmental stewardship:

- **Optimize algorithms**: More efficient code means less computational power
- **Minimize data transfer**: Compress images, optimize APIs, reduce payload sizes
- **Progressive loading**: Load only what users need, when they need it

### Green Hosting
Choose hosting providers that prioritize renewable energy:

- Look for carbon-neutral or carbon-negative hosting
- Consider edge computing to reduce data transfer distances
- Use CDNs with renewable energy commitments

### Sustainable Design Patterns
- **Dark mode**: Can reduce energy consumption on OLED screens
- **Minimal interfaces**: Less visual complexity means lower processing requirements
- **Lazy loading**: Only load content when needed

## The Circular Economy in Tech

Moving beyond the linear "make-take-dispose" model:

### Design for Longevity
- Build software that works well on older devices
- Prioritize backwards compatibility
- Create modular, upgradeable systems

### Repair and Reuse
- Open source hardware designs
- Right to repair advocacy
- Refurbishment programs

## Measuring Impact

Track your environmental footprint:

- Use tools like Website Carbon Calculator
- Monitor server energy usage
- Set sustainability KPIs alongside business metrics

## The Business Case

Sustainability isn't just ethical—it's profitable:

- **Cost Savings**: Efficient code reduces hosting costs
- **Brand Value**: Consumers increasingly prefer sustainable brands
- **Future-Proofing**: Environmental regulations are only getting stricter

## Small Changes, Big Impact

Individual developers and companies can make a difference:

- Choose renewable energy for offices and servers
- Implement remote work policies to reduce commuting
- Prioritize digital-first processes to reduce paper waste
- Support open source projects that promote sustainability

## Conclusion

Building sustainable technology requires intentional choices at every level—from the code we write to the servers we deploy. As technologists, we have the power and responsibility to build a digital future that doesn't compromise our planet's future.

The question isn't whether we can afford to build sustainably—it's whether we can afford not to.
    `,
    author: "MK Fain",
    date: "2024-02-28",
    category: "Sustainability",
    tags: ["Environment", "Technology", "Sustainability"],
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=600&fit=crop&auto=format",
    readTime: "7 min read"
  },
  {
    id: 5,
    title: "The Art of Digital Minimalism",
    excerpt: "How reducing digital clutter and focusing on essential tools can lead to increased productivity and mental clarity in our hyper-connected world.",
    content: `
# The Art of Digital Minimalism

In our hyper-connected world, we're drowning in digital noise. Notifications compete for our attention, apps multiply on our devices, and our digital lives often feel chaotic and overwhelming. Digital minimalism offers a path to intentional technology use.

## What is Digital Minimalism?

Digital minimalism is a philosophy that helps you focus on the technology that serves your values and eliminate everything else. It's not about rejecting technology—it's about being more intentional with how we use it.

### Core Principles

**Value-Driven**: Every digital tool should serve a specific purpose aligned with your values.

**Quality over Quantity**: A few high-quality tools that do their job well are better than dozens of mediocre apps.

**Intentional Use**: Be deliberate about when, where, and how you use technology.

## The Attention Economy Problem

Modern technology is designed to capture and hold our attention:

### The Dopamine Loop
- Apps use variable reward schedules to create addiction
- Infinite scroll keeps us engaged indefinitely
- Push notifications interrupt our focus constantly

### The Cost of Context Switching
Research shows that it takes an average of 23 minutes to fully refocus after an interruption. In our notification-heavy world, we're rarely operating at full cognitive capacity.

## Practical Digital Minimalism

### App Audit
Regularly review your digital tools:

1. **List all apps** on your devices
2. **Categorize by purpose**: Essential, useful, or time-wasting
3. **Remove ruthlessly**: Delete apps that don't serve a clear purpose
4. **Consolidate functions**: Use fewer tools that do more

### Notification Hygiene
Take control of your attention:

- Turn off all non-essential notifications
- Use "Do Not Disturb" modes liberally
- Batch process communications at set times
- Keep your phone in another room while working

### Digital Decluttering Rituals

**Weekly Reviews**:
- Clean up your desktop and downloads folder
- Unsubscribe from irrelevant email lists
- Review and organize your digital notes

**Monthly Purges**:
- Delete unused apps and browser extensions
- Clear out old photos and files
- Review your social media follows and subscriptions

## The Tools That Matter

Focus on technology that genuinely improves your life:

### Essential Categories
- **Communication**: One or two platforms for staying connected
- **Productivity**: Simple, focused tools for getting work done
- **Learning**: Resources that genuinely expand your knowledge
- **Creation**: Tools that help you make things you're proud of

### Quality Indicators
- **Single Purpose**: Does one thing extremely well
- **Offline Capability**: Works without constant internet connection
- **Privacy Respecting**: Doesn't harvest your data unnecessarily
- **Long-term Viability**: Likely to be around for years

## The Benefits of Less

Embracing digital minimalism leads to:

### Improved Focus
With fewer distractions, you can engage in deep, meaningful work. Your attention becomes a tool you control rather than a resource others exploit.

### Reduced Anxiety
Constant connectivity creates a low-level stress. Digital minimalism helps restore mental calm and reduces the fear of missing out.

### More Intentional Relationships
Without the shallow interactions of social media feeds, you can invest more deeply in real relationships.

### Enhanced Creativity
Boredom and mental space are prerequisites for creativity. Digital minimalism creates the mental breathing room necessary for new ideas.

## Creating Digital Boundaries

### Time Boundaries
- No screens for the first hour after waking
- Digital sunset: no devices 1-2 hours before bed
- Designated device-free times during meals

### Space Boundaries
- Keep bedrooms device-free
- Create dedicated work and relaxation spaces
- Use physical books and notebooks when possible

### Social Boundaries
- Don't feel obligated to respond immediately
- Choose quality conversations over quantity
- Practice saying no to digital commitments

## The 30-Day Digital Declutter

Try this month-long experiment:

**Week 1**: Remove all optional technologies from your life
**Week 2**: Notice what you actually miss vs. what you think you miss
**Week 3**: Experiment with analog alternatives
**Week 4**: Slowly reintroduce only the tools that serve your values

## Beyond Personal Practice

Digital minimalism isn't just individual—it's cultural:

### Supporting Ethical Technology
Choose companies and products that align with minimalist values:
- Transparent business models
- Respect for user attention
- Sustainable practices
- Open source when possible

### Teaching Others
Share your experience with digital minimalism:
- Model healthy technology use
- Discuss the benefits with friends and family
- Support digital wellness education

## Conclusion

Digital minimalism isn't about living in the past—it's about being intentional with the future. In a world designed to scatter our attention, choosing focus becomes a radical act.

The goal isn't to use less technology for its own sake, but to use technology in service of what you value most. When we align our digital tools with our deepest values, technology becomes a support for the life we want to live rather than a distraction from it.

Less noise, more signal. Less busy, more productive. Less connected, more present.

That's the art of digital minimalism.
    `,
    author: "MK Fain",
    date: "2024-02-22",
    category: "Lifestyle",
    tags: ["Minimalism", "Productivity", "Wellness"],
    image: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=1200&h=600&fit=crop&auto=format",
    readTime: "4 min read"
  }
];

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find(p => p.id === parseInt(id || '0'));

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-blue-600 hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  useSeoMeta({
    title: `${post.title} - MK Fain`,
    description: post.excerpt,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-slate-900 dark:text-white">
              MK Fain
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Home
              </Link>
              <Link to="/blog" className="text-slate-900 dark:text-white font-medium">
                Blog
              </Link>
              <Link to="/about" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                About
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Back to Blog */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/blog" className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blog</span>
          </Link>
        </Button>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 pb-12">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Hero Image */}
          <div className="aspect-[21/9] overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          <CardHeader className="space-y-4">
            {/* Meta Info */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                <Badge variant="secondary">{post.category}</Badge>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-sm px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full"
                >
                  #{tag.toLowerCase()}
                </span>
              ))}
            </div>
          </CardHeader>

          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
              {post.content}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="mt-12">
          <CommentsSection
            root={new URL(`${window.location.origin}/blog/${post.id}`)}
            title="Comments"
            emptyStateMessage="No comments yet"
            emptyStateSubtitle="Be the first to share your thoughts!"
          />
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Built with React and Nostr protocols
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Vibed with <a href="https://soapbox.pub/mkstack" className="text-blue-600 dark:text-blue-400 hover:underline">MKStack</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;