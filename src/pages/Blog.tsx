import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock blog posts data
const blogPosts = [
  {
    id: 1,
    title: "The Future of Decentralized Social Media",
    excerpt: "Exploring how protocols like Nostr are revolutionizing the way we connect and share information online, creating a more open and censorship-resistant internet.",
    content: "Full blog post content would go here...",
    author: "Blog Author",
    date: "2024-03-15",
    category: "Technology",
    tags: ["Nostr", "Decentralization", "Social Media"],
    image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop&auto=format",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "Building Privacy-First Applications",
    excerpt: "A deep dive into creating applications that prioritize user privacy and data sovereignty, with practical examples and implementation strategies.",
    content: "Full blog post content would go here...",
    author: "Blog Author",
    date: "2024-03-10",
    category: "Privacy",
    tags: ["Privacy", "Security", "Development"],
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop&auto=format",
    readTime: "8 min read"
  },
  {
    id: 3,
    title: "The Philosophy of Open Source",
    excerpt: "Reflecting on the principles that drive open source development and how it creates a more collaborative and innovative technological landscape.",
    content: "Full blog post content would go here...",
    author: "Blog Author",
    date: "2024-03-05",
    category: "Philosophy",
    tags: ["Open Source", "Philosophy", "Community"],
    image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=400&fit=crop&auto=format",
    readTime: "6 min read"
  },
  {
    id: 4,
    title: "Sustainable Technology Practices",
    excerpt: "Examining how we can build technology that's not just innovative, but also environmentally conscious and sustainable for future generations.",
    content: "Full blog post content would go here...",
    author: "Blog Author",
    date: "2024-02-28",
    category: "Sustainability",
    tags: ["Environment", "Technology", "Sustainability"],
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop&auto=format",
    readTime: "7 min read"
  },
  {
    id: 5,
    title: "The Art of Digital Minimalism",
    excerpt: "How reducing digital clutter and focusing on essential tools can lead to increased productivity and mental clarity in our hyper-connected world.",
    content: "Full blog post content would go here...",
    author: "Blog Author",
    date: "2024-02-22",
    category: "Lifestyle",
    tags: ["Minimalism", "Productivity", "Wellness"],
    image: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800&h=400&fit=crop&auto=format",
    readTime: "4 min read"
  },
  {
    id: 6,
    title: "The Ethics of AI Development",
    excerpt: "As artificial intelligence becomes more powerful, we must carefully consider the ethical implications of the systems we're building and deploying.",
    content: "Full blog post content would go here...",
    author: "Blog Author",
    date: "2024-02-15",
    category: "Ethics",
    tags: ["AI", "Ethics", "Technology"],
    image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&h=400&fit=crop&auto=format",
    readTime: "6 min read"
  }
];

const Blog = () => {
  useSeoMeta({
    title: 'Blog - My Personal Blog',
    description: 'Thoughts on technology, privacy, open source, and digital life.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-slate-900 dark:text-white">
              My Blog
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

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Blog
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Thoughts on technology, privacy, open source, and building a better digital future.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto"
                      asChild
                    >
                      <Link to={`/blog/${post.id}`} className="flex items-center space-x-1">
                        <span className="text-xs">Read more</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full"
                      >
                        #{tag.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-8">
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

export default Blog;