import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, User, Calendar, ExternalLink } from 'lucide-react';

const Index = () => {
  useSeoMeta({
    title: 'My Personal Blog',
    description: 'A modern personal blog built with React and Nostr protocols. Share your thoughts and connect with readers.',
  });

  // Recent blog posts preview
  const recentPosts = [
    {
      id: 1,
      title: "The Future of Decentralized Social Media",
      excerpt: "Exploring how protocols like Nostr are revolutionizing the way we connect online.",
      date: "2024-03-15",
      category: "Technology",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Building Privacy-First Applications",
      excerpt: "A deep dive into creating applications that prioritize user privacy and data sovereignty.",
      date: "2024-03-10",
      category: "Privacy",
      readTime: "8 min read"
    },
    {
      id: 3,
      title: "The Philosophy of Open Source",
      excerpt: "Reflecting on the principles that drive open source development and collaboration.",
      date: "2024-03-05",
      category: "Philosophy",
      readTime: "6 min read"
    }
  ];

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
              <Link to="/" className="text-slate-900 dark:text-white font-medium">
                Home
              </Link>
              <Link to="/blog" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
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
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Welcome to My
                <span className="text-blue-600 dark:text-blue-400"> Personal </span>
                Blog
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                A place to share thoughts, ideas, and insights about technology, life, and everything in between.
                Join the conversation and explore new perspectives.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link to="/blog" className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Read My Blog</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/about" className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>About Me</span>
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=600&fit=crop&auto=format"
                  alt="Decentralized network visualization"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Personal Blog</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Modern Tech</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">
            Featured Topics
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-center mb-12">
            Explore the subjects I'm passionate about
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Technology",
                description: "Exploring the latest trends, innovations, and their impact on our daily lives",
                badge: "Tech Insights"
              },
              {
                name: "Privacy",
                description: "Understanding digital privacy, security, and protecting your online presence",
                badge: "Digital Rights"
              },
              {
                name: "Philosophy",
                description: "Deep thoughts on life, ethics, and the human experience in the modern world",
                badge: "Deep Thinking"
              },
              {
                name: "Lifestyle",
                description: "Tips for productivity, wellness, and living intentionally in a digital age",
                badge: "Life Tips"
              }
            ].map((topic, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{topic.name}</h3>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                  </div>
                  <Badge variant="secondary" className="text-xs w-fit">{topic.badge}</Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {topic.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Recent Posts
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Thoughts on technology, freedom, and the future
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/blog" className="flex items-center space-x-2">
                <span>View All Posts</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post) => (
              <Card key={post.id} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-slate-900 dark:bg-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the Conversation
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Have thoughts on any of the topics I write about?
            I'd love to hear from you and start a meaningful discussion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/about" className="flex items-center space-x-2">
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-slate-900" asChild>
              <Link to="/blog" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Start Reading</span>
              </Link>
            </Button>
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

export default Index;
