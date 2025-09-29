import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { MapPin, Camera, Plane, Heart, Mail, Instagram, Youtube, Globe } from 'lucide-react';

const About = () => {
  useSeoMeta({
    title: 'About - Wanderlust Chronicles',
    description: 'Meet the traveler behind Wanderlust Chronicles. Discover the passion for exploration, cultural discovery, and storytelling that drives these adventures.',
  });

  const travelStats = [
    { number: "47", label: "Countries Visited" },
    { number: "6", label: "Continents Explored" },
    { number: "12", label: "Languages Attempted" },
    { number: "∞", label: "Memories Made" }
  ];

  const favoriteDestinations = [
    { name: "Kyoto, Japan", reason: "Where ancient tradition meets modern wonder", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=300&h=200&fit=crop&auto=format" },
    { name: "Patagonia, Chile", reason: "Raw wilderness that humbles the soul", image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=300&h=200&fit=crop&auto=format" },
    { name: "Santorini, Greece", reason: "Where the Mediterranean shows off", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=300&h=200&fit=crop&auto=format" },
    { name: "Bangkok, Thailand", reason: "A feast for every sense imaginable", image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=300&h=200&fit=crop&auto=format" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
              Wanderlust
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
              <Link to="/blog" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Stories</Link>
              <Link to="/about" className="text-gray-900 dark:text-white font-medium">About</Link>
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
                Hello, I'm Your
                <span className="block text-blue-600 dark:text-blue-400">Travel Guide</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Welcome to my world of wanderlust! I'm a passionate traveler, storyteller,
                and cultural enthusiast who believes that the best education comes from
                exploring our incredible planet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:hello@wanderlust.com"
                  className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span>Get in Touch</span>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                  <span>Follow My Journey</span>
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=750&fit=crop&auto=format"
                  alt="Travel Blogger"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Currently in</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bali, Indonesia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Travel Stats */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              My Journey in Numbers
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Every number tells a story, every destination has left its mark on my heart.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {travelStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* My Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 font-serif text-center">
            My Story
          </h2>

          <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300 space-y-6">
            <p className="text-xl leading-relaxed">
              My love affair with travel began with a backpack, a Eurail pass, and absolutely
              no plan. That first solo trip through Europe at 22 changed everything—I discovered
              that the world was far more beautiful, complex, and welcoming than I had ever imagined.
            </p>

            <p className="leading-relaxed">
              Since then, I've been fortunate to explore 47 countries across 6 continents,
              from the bustling streets of Bangkok to the serene temples of Kyoto, from the
              rugged wilderness of Patagonia to the sun-soaked islands of Greece. Each journey
              has taught me something new about the world and about myself.
            </p>

            <p className="leading-relaxed">
              What drives me isn't just the thrill of seeing new places—it's the connections
              I make with people along the way. The monk who shared tea with me in a hidden
              temple, the street food vendor who taught me about Thai spices, the fellow
              travelers who became lifelong friends under the northern lights—these are the
              moments that make travel magical.
            </p>

            <p className="leading-relaxed">
              Through this blog, I want to share not just the destinations I visit, but the
              stories that unfold along the way. Travel isn't just about the places we see;
              it's about the perspectives we gain, the prejudices we shed, and the compassion
              we develop for our fellow human beings.
            </p>
          </div>
        </div>
      </section>

      {/* Favorite Destinations */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif text-center">
            Destinations Close to My Heart
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            While every place I've visited has left its mark, these destinations hold special significance in my journey.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {favoriteDestinations.map((destination, index) => (
              <div key={index} className="group">
                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {destination.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {destination.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Philosophy */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 font-serif text-center">
            My Travel Philosophy
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Heart className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Travel with Purpose</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Every journey should leave both the traveler and the destination a little bit better.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Camera className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Capture Stories, Not Just Photos</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    The best souvenirs are the connections we make and the perspectives we gain.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Plane className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Embrace the Unexpected</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    The best adventures often begin when things don't go according to plan.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Globe className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Think Globally, Connect Locally</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    The world becomes smaller when we take time to understand each other.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 font-serif">Let's Connect</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Have a travel question? Want to share your own adventure?
            I'd love to hear from fellow wanderers and dreamers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@wanderlust.com"
              className="inline-flex items-center justify-center space-x-2 bg-white text-blue-600 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span>Email Me</span>
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center space-x-2 border border-white text-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-blue-600 transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span>Instagram</span>
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center space-x-2 border border-white text-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-blue-600 transition-colors"
            >
              <Youtube className="h-5 w-5" />
              <span>YouTube</span>
            </a>
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

export default About;