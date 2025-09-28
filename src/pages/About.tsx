import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mail, Github, Twitter, Globe, Book, Coffee, Heart } from 'lucide-react';

const About = () => {
  useSeoMeta({
    title: 'About - MK Fain',
    description: 'Learn more about MK Fain - freedom advocate, developer, and writer passionate about building a better digital future.',
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
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&auto=format"
                alt="MK Fain"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Hey, I'm MK Fain
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Freedom advocate, developer, and writer passionate about building a better digital future.
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
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">About Me</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  I'm a passionate advocate for digital freedom and privacy, working at the intersection of technology, 
                  philosophy, and human rights. As part of Team Soapbox, I'm dedicated to building tools that empower 
                  individuals and communities to communicate freely and securely.
                </p>
                
                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  My work focuses on decentralized technologies, particularly the Nostr protocol, which represents 
                  a fundamental shift toward a more open and censorship-resistant internet. I believe that technology 
                  should serve humanity, not the other way around.
                </p>

                <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                  When I'm not coding or writing, you'll find me reading about philosophy, tending to plants, 
                  spending time with animals, or exploring sustainable living practices. I'm also a dedicated vegan, 
                  believing that our choices in technology and life should reflect our values of compassion and sustainability.
                </p>
              </div>

              {/* Interests */}
              <div className="pt-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Interests & Values</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Decentralization", icon: Globe },
                    { label: "Open Source", icon: Github },
                    { label: "Privacy Rights", icon: Heart },
                    { label: "Philosophy", icon: Book },
                    { label: "Sustainability", icon: Coffee },
                    { label: "Animal Rights", icon: Heart }
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

          {/* Projects Card */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Projects & Work</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Ditto</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    A powerful Nostr relay implementation that bridges the gap between traditional social media 
                    and decentralized protocols.
                  </p>
                  <Badge variant="outline">Nostr</Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">MKStack</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    A comprehensive development stack for building modern, privacy-focused web applications 
                    with Nostr integration.
                  </p>
                  <Badge variant="outline">Development Tools</Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Bookstr</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Exploring how decentralized protocols can revolutionize book recommendations, 
                    reading communities, and literary discussions.
                  </p>
                  <Badge variant="outline">Community</Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Shakespeare</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    An AI-powered Nostr website builder that democratizes web development through 
                    natural language conversation.
                  </p>
                  <Badge variant="outline">AI Tools</Badge>
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
                I'm always interested in connecting with fellow builders, thinkers, and advocates for digital freedom. 
                Feel free to reach out through any of these channels:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start" asChild>
                  <a href="mailto:mk@ditto.pub" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>mk@ditto.pub</span>
                  </a>
                </Button>

                <Button variant="outline" className="justify-start" asChild>
                  <a href="https://marykatefain.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>marykatefain.com</span>
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
                  <strong>Nostr:</strong> npub1jvnpg4c6ljadf5t6ry0w9q0rnm4mksde87kglkrc993z46c39axsgq89sc
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  <strong>Lightning:</strong> zapmk@getalby.com
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