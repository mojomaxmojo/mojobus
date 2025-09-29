import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Calendar, Clock } from 'lucide-react';

const Index = () => {
  useSeoMeta({
    title: 'Wanderlust Chronicles - Travel Stories & Adventures',
    description: 'Join me on extraordinary journeys around the world. Discover hidden gems, cultural insights, and travel inspiration from every corner of the globe.',
  });

  // Featured stories
  const featuredStories = [
    {
      id: 1,
      title: "Lost in the Bamboo Forests of Kyoto",
      excerpt: "A serendipitous journey through Japan's ancient capital, where tradition meets modernity in the most unexpected ways.",
      location: "Kyoto, Japan",
      date: "March 15, 2024",
      readTime: "8 min",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop&auto=format",
      featured: true
    },
    {
      id: 2,
      title: "Chasing Northern Lights in Iceland",
      excerpt: "Three unforgettable nights under the Arctic sky, waiting for nature's most spectacular light show.",
      location: "Reykjavik, Iceland",
      date: "February 28, 2024",
      readTime: "6 min",
      image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=500&fit=crop&auto=format"
    },
    {
      id: 3,
      title: "Street Food Adventures in Bangkok",
      excerpt: "From floating markets to hidden alleyway stalls, discovering Thailand's incredible culinary soul.",
      location: "Bangkok, Thailand",
      date: "February 14, 2024",
      readTime: "5 min",
      image: "https://images.unsplash.com/photo-1552566634-75bf769b8b4c?w=800&h=500&fit=crop&auto=format"
    }
  ];

  const destinations = [
    { name: "Southeast Asia", count: 12, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop&auto=format" },
    { name: "Northern Europe", count: 8, image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=200&fit=crop&auto=format" },
    { name: "Mediterranean", count: 15, image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=300&h=200&fit=crop&auto=format" },
    { name: "South America", count: 6, image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=300&h=200&fit=crop&auto=format" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              Wanderlust
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-900 dark:text-white font-medium">Home</Link>
              <Link to="/blog" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Stories</Link>
              <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight font-serif">
              Wanderlust
              <span className="block text-blue-600 dark:text-blue-400">Chronicles</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Join me on extraordinary journeys around the world. Discover hidden gems,
              cultural insights, and travel inspiration from every corner of the globe.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <span>Start Exploring</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Featured Story */}
          {featuredStories[0] && (
            <div className="relative group cursor-pointer mb-16">
              <Link to={`/blog/${featuredStories[0].id}`}>
                <div className="aspect-[21/9] rounded-2xl overflow-hidden">
                  <img
                    src={featuredStories[0].image}
                    alt={featuredStories[0].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-8 left-8 right-8 text-white">
                  <div className="flex items-center space-x-4 mb-4 text-sm">
                    <span className="bg-blue-600 px-3 py-1 rounded-full font-medium">Featured</span>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{featuredStories[0].location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(featuredStories[0].date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{featuredStories[0].readTime}</span>
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight font-serif">
                    {featuredStories[0].title}
                  </h2>
                  <p className="text-xl text-gray-200 max-w-2xl">
                    {featuredStories[0].excerpt}
                  </p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Recent Stories */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-serif">Latest Adventures</h2>
              <p className="text-gray-600 dark:text-gray-300">Fresh stories from the road</p>
            </div>
            <Link
              to="/blog"
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center space-x-1"
            >
              <span>View all stories</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {featuredStories.slice(1).map((story) => (
              <article key={story.id} className="group cursor-pointer">
                <Link to={`/blog/${story.id}`}>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-6">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{story.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(story.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{story.readTime}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-serif">
                      {story.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {story.excerpt}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif">Destinations</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explore the corners of the world I've been fortunate to visit, each with its own unique story to tell.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {destinations.map((destination, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {destination.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {destination.count} stories
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 font-serif">Never Miss an Adventure</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Get the latest travel stories, tips, and destination guides delivered straight to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4 font-serif">Wanderlust Chronicles</h3>
              <p className="text-gray-400 max-w-md">
                Inspiring wanderers to explore the world, one story at a time.
                Join me on this incredible journey of discovery and adventure.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/blog" className="hover:text-white transition-colors">All Stories</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Destinations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Travel Tips</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>Built with React and Nostr protocols</p>
            <p className="text-sm mt-2">
              Vibed with <a href="https://soapbox.pub/mkstack" className="text-blue-400 hover:underline">MKStack</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
