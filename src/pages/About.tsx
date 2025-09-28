import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mail, Github, Twitter, Globe, Book, Coffee, Heart } from 'lucide-react';

const About = () => {
  useSeoMeta({
    title: 'About - My Personal Blog',
    description: 'Learn more about the author and what drives this blog. Discover the topics, values, and ideas that shape these writings.',
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
              <Link to="/blog" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                Blog
              </Link>
              <Link to="/about" className="text-slate-900 dark:text-white font-medium">
                About
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format"
                alt="Blog Author"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Hi, I'm the Author
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Welcome to my corner of the internet where I share thoughts, insights, and discoveries about the world around us.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* About Card */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">About This Blog</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  This blog is a space for exploring ideas, sharing knowledge, and connecting with others who are 
                  curious about the world. Here you'll find thoughtful articles about technology, personal growth, 
                  and the intersection of digital life with human experience.
                </p>
                
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  I believe in the power of open dialogue and the importance of questioning assumptions. 
                  Whether we're discussing the latest technological innovations or reflecting on timeless 
                  philosophical questions, my goal is to provide content that informs, challenges, and inspires.
                </p>

                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  This blog is built with modern web technologies and embraces principles of privacy, 
                  decentralization, and user empowerment. It's designed to be a place where ideas can 
                  flourish and meaningful conversations can take place.
                </p>
              </div>

              {/* Interests */}
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Topics I Write About</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Technology", icon: Globe },
                    { label: "Privacy & Security", icon: Heart },
                    { label: "Philosophy", icon: Book },
                    { label: "Personal Growth", icon: Coffee },
                    { label: "Digital Minimalism", icon: Heart },
                    { label: "Open Source", icon: Github }
                  ].map((interest, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1 px-3 py-1">
                      <interest.icon className="h-3 w-3" />
                      <span>{interest.label}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Writing Philosophy Card */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Writing Philosophy</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Thoughtful Content</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Every post is carefully researched and thoughtfully written. I believe in quality over quantity 
                    and strive to provide value in every article.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Open Discussion</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    I encourage comments, questions, and different perspectives. The best ideas emerge through 
                    respectful dialogue and intellectual curiosity.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Practical Insights</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    While I enjoy theoretical discussions, I always aim to provide practical takeaways that 
                    readers can apply in their own lives and work.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Continuous Learning</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    I'm always learning and evolving. My views may change as I gain new insights, and I'm 
                    not afraid to revisit and update previous thoughts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Get in Touch</h2>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                I love hearing from readers! Whether you have questions, comments, or just want to say hello, 
                don't hesitate to reach out. I try to respond to all messages.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start" asChild>
                  <a href="mailto:hello@myblog.com" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>hello@myblog.com</span>
                  </a>
                </Button>

                <Button variant="outline" className="justify-start" asChild>
                  <a href="https://myblog.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>myblog.com</span>
                  </a>
                </Button>

                <Button variant="outline" className="justify-start" asChild>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                  </a>
                </Button>

                <Button variant="outline" className="justify-start" asChild>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                    <Twitter className="h-4 w-4" />
                    <span>Twitter</span>
                  </a>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Response Time:</strong> I typically respond to emails within 24-48 hours. For urgent matters, please mention it in the subject line.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <strong>Comments:</strong> You can also leave comments on any blog post using the Nostr-powered commenting system below each article.
                </p>
              </div>
            </CardContent>
          </Card>
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

export default About;