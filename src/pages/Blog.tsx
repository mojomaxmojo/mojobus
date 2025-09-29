import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock } from 'lucide-react';

// Travel blog posts data
const blogPosts = [
  {
    id: 1,
    title: "Lost in the Bamboo Forests of Kyoto",
    excerpt: "A serendipitous journey through Japan's ancient capital, where tradition meets modernity in the most unexpected ways. Discover the hidden temples, peaceful gardens, and the gentle whispers of history that echo through every bamboo grove.",
    content: "Full blog post content would go here...",
    author: "Travel Blogger",
    date: "2024-03-15",
    location: "Kyoto, Japan",
    category: "Cultural Discovery",
    tags: ["Japan", "Culture", "Temples", "Nature"],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=500&fit=crop&auto=format",
    readTime: "8 min"
  },
  {
    id: 2,
    title: "Chasing Northern Lights in Iceland",
    excerpt: "Three unforgettable nights under the Arctic sky, waiting for nature's most spectacular light show. From hot springs to frozen waterfalls, Iceland revealed its magic in ways I never imagined possible.",
    content: "Full blog post content would go here...",
    author: "Travel Blogger",
    date: "2024-02-28",
    location: "Reykjavik, Iceland",
    category: "Adventure",
    tags: ["Iceland", "Northern Lights", "Adventure", "Photography"],
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=500&fit=crop&auto=format",
    readTime: "6 min"
  },
  {
    id: 3,
    title: "Street Food Adventures in Bangkok",
    excerpt: "From floating markets to hidden alleyway stalls, discovering Thailand's incredible culinary soul. Each dish tells a story, each flavor carries generations of tradition and innovation.",
    content: "Full blog post content would go here...",
    author: "Travel Blogger",
    date: "2024-02-14",
    location: "Bangkok, Thailand",
    category: "Culinary Journey",
    tags: ["Thailand", "Food", "Street Food", "Culture"],
    image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=800&h=500&fit=crop&auto=format",
    readTime: "5 min"
  },
  {
    id: 4,
    title: "Sunrise Over Santorini's Blue Domes",
    excerpt: "Watching the world wake up from the cliffs of Oia, where white-washed buildings meet endless azure seas. A meditation on beauty, solitude, and the simple joy of being present.",
    content: "Full blog post content would go here...",
    author: "Travel Blogger",
    date: "2024-01-30",
    location: "Santorini, Greece",
    category: "Island Life",
    tags: ["Greece", "Islands", "Photography", "Sunset"],
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=500&fit=crop&auto=format",
    readTime: "4 min"
  },
  {
    id: 5,
    title: "Trekking Through Patagonia's Wilderness",
    excerpt: "Seven days of raw beauty in one of Earth's last frontiers. Massive glaciers, towering peaks, and the humbling reminder of nature's incredible power and our place within it.",
    content: "Full blog post content would go here...",
    author: "Travel Blogger",
    date: "2024-01-15",
    location: "Torres del Paine, Chile",
    category: "Adventure",
    tags: ["Chile", "Hiking", "Nature", "Wilderness"],
    image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&h=500&fit=crop&auto=format",
    readTime: "10 min"
  },
  {
    id: 6,
    title: "Coffee Culture in the Mountains of Colombia",
    excerpt: "High in the Andes, where coffee grows slowly and perfectly, learning about the art, science, and soul of Colombia's most famous export from the families who've perfected it for generations.",
    content: "Full blog post content would go here...",
    author: "Travel Blogger",
    date: "2023-12-20",
    location: "Coffee Triangle, Colombia",
    category: "Culinary Journey",
    tags: ["Colombia", "Coffee", "Culture", "Mountains"],
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=500&fit=crop&auto=format",
    readTime: "7 min"
  }
];

const Blog = () => {
  useSeoMeta({
    title: 'Travel Stories - Wanderlust Chronicles',
    description: 'Discover incredible travel stories, cultural insights, and adventure inspiration from around the world.',
  });

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
              <Link to="/blog" className="text-gray-900 dark:text-white font-medium">Stories</Link>
              <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-24 pb-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 font-serif">
            Travel Stories
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Adventures, discoveries, and moments of wonder from every corner of the globe.
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="group cursor-pointer">
                <Link to={`/blog/${post.id}`}>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden mb-6">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="space-y-3">
                    {/* Meta info */}
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-serif leading-tight">
                      {post.title}
                    </h2>

                    {/* Location and date */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{post.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Excerpt */}
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full"
                        >
                          #{tag.toLowerCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </article>
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

export default Blog;