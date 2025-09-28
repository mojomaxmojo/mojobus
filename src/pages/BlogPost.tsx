import { useSeoMeta } from '@unhead/react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowLeft, Share2, User } from 'lucide-react';
import { CommentsSection } from '@/components/comments/CommentsSection';

// Travel blog posts data (matching Blog.tsx)
const blogPosts = [
  {
    id: 1,
    title: "Lost in the Bamboo Forests of Kyoto",
    excerpt: "A serendipitous journey through Japan's ancient capital, where tradition meets modernity in the most unexpected ways.",
    content: `
# Lost in the Bamboo Forests of Kyoto

The morning mist clung to the ancient stones of Kyoto like whispered secrets from centuries past. I had arrived in Japan's former imperial capital with a carefully planned itinerary, but sometimes the most magical travel moments happen when you throw the map away and follow your curiosity instead.

## The Unexpected Turn

It started with a wrong turn. I was searching for the famous Fushimi Inari shrine when I found myself on a narrow path lined with towering bamboo. The sound was hypnotic—thousands of green stalks swaying in the breeze, creating a natural symphony that seemed to pull me deeper into the grove.

The path twisted and turned, each bend revealing new corridors of emerald light. Sunbeams filtered through the canopy above, casting dancing shadows on the forest floor. I realized I was completely lost, but for the first time in months, I didn't care about my destination.

## Discovering Hidden Temples

After what felt like hours of wandering (though my phone insisted it had only been 30 minutes), I emerged into a small clearing. There, almost hidden behind a curtain of bamboo, stood a tiny temple I had never seen in any guidebook.

An elderly monk was sweeping the entrance with deliberate, meditative movements. When he noticed me, he smiled and gestured for me to approach. Despite our language barrier, his warmth was universal. He led me to a stone bench where we sat in comfortable silence, sharing green tea from a thermos he produced from his robes.

### The Art of Presence

In that moment, I understood something profound about travel. We often rush from landmark to landmark, checking boxes on our itineraries, but the real magic happens in the spaces between—in the wrong turns, the unexpected encounters, the moments when we stop trying to control our experience and let the journey unfold naturally.

The monk pointed to a small garden behind the temple where cherry blossoms were just beginning to bloom. Even though it was early in the season, a few brave petals had opened, their soft pink contrasting beautifully with the deep green bamboo backdrop.

## Lessons from the Forest

As I finally found my way back to civilization (with some gentle directions from my new friend), I carried with me more than just photos and memories. The bamboo forest had taught me several important lessons:

**Embrace the Unexpected**: Some of the best experiences come from unplanned detours. That "wrong turn" led me to one of the most peaceful and meaningful moments of my entire trip.

**Slow Down**: In our rush to see everything, we often miss the subtle beauty right in front of us. The forest forced me to move at nature's pace, and I was rewarded with sounds, scents, and sights I would have missed at tourist speed.

**Connect Without Words**: My conversation with the monk reminded me that human connection transcends language. Sometimes a shared smile and a cup of tea communicate more than a thousand words.

## The Magic of Kyoto

Kyoto has a way of revealing itself slowly, like layers of an ancient scroll being carefully unrolled. The city seamlessly blends the sacred and the everyday—you might find a 1,000-year-old temple sandwiched between a convenience store and a ramen shop, and somehow it all makes perfect sense.

The bamboo forest became my retreat during the rest of my stay. I returned several times, each visit revealing new details: the way morning light differed from afternoon shadows, how the sound changed with the wind's intensity, the small shrines tucked into alcoves I had missed before.

## Finding Your Own Path

Travel isn't just about the places we visit; it's about the perspectives we gain and the parts of ourselves we discover along the way. That morning in the bamboo forest reminded me that sometimes the best adventures begin when we get lost.

So next time you're traveling, consider taking that interesting side street, following that intriguing path, or accepting that invitation from a stranger. You might just find your own bamboo forest—a place that exists not just in geography, but in the moments when we're fully present and open to wonder.

The bamboo grove of Kyoto taught me that being lost isn't always a problem to be solved. Sometimes, it's exactly where we need to be.
    `,
    author: "Travel Blogger",
    date: "2024-03-15",
    location: "Kyoto, Japan",
    category: "Cultural Discovery",
    tags: ["Japan", "Culture", "Temples", "Nature"],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=600&fit=crop&auto=format",
    readTime: "8 min"
  },
  {
    id: 2,
    title: "Chasing Northern Lights in Iceland",
    excerpt: "Three unforgettable nights under the Arctic sky, waiting for nature's most spectacular light show.",
    content: `
# Chasing Northern Lights in Iceland

Iceland in winter is a land of extremes—where fire meets ice, where darkness dominates but light dances across the sky in the most spectacular way imaginable. I spent three nights chasing the aurora borealis, and what I discovered was far more than just a natural phenomenon.

## Night One: The Learning Curve

My first attempt at northern lights hunting was, admittedly, amateur hour. Armed with nothing but enthusiasm and a basic camera, I joined a bus tour filled with equally hopeful tourists. We drove for hours into the countryside, stopping at various dark locations, craning our necks toward the sky.

The guide kept checking his aurora app and looking concerned. "Solar activity is low tonight," he explained. "But sometimes the lights surprise us."

Around 11 PM, just as I was starting to think we'd return empty-handed, someone shouted "There!" A faint green arc had appeared on the horizon, barely visible to the naked eye but clear enough through the camera lens.

It wasn't the dramatic display I had imagined, but watching that subtle glow dance across the sky for the first time was magical nonetheless. I learned that northern lights photography is as much about patience as it is about luck.

## Night Two: Going Solo

Emboldened by my first sighting, I decided to venture out alone. I rented a car and drove to the Jökulsárlón glacier lagoon, about three hours from Reykjavik. The plan was to combine ice and aurora—if the lights appeared.

The drive through Iceland's winter landscape is otherworldly. Snow-covered volcanic fields stretch endlessly, punctuated by steaming hot springs and ice formations that look like alien sculptures. Even without the northern lights, the journey was worth it.

At the glacier lagoon, massive icebergs float like silent monuments in the dark water. I set up my tripod on the shore and waited. And waited. The cold was intense—even with multiple layers, hand warmers, and a thermos of hot coffee, I could barely feel my fingers after an hour.

Then, around midnight, the sky erupted.

## The Dance Begins

What started as a faint green curtain quickly intensified into ribbons of light that swept across the entire sky. Green, purple, and even hints of pink danced overhead, reflecting off the icebergs below. For nearly an hour, I watched nature's most incredible light show, frantically taking photos but mostly just standing there in awe.

The aurora moves faster than you expect. It pulses and waves like a living thing, appearing in one part of the sky only to vanish and reappear somewhere else entirely. No photograph can capture the dynamic nature of this phenomenon—you have to experience it.

## Night Three: The Perfect Storm

My final night in Iceland delivered the kind of aurora display that locals say happens maybe once or twice a year. Clear skies, high solar activity, and perfect viewing conditions combined for what can only be described as a cosmic symphony.

I was back at the glacier lagoon, this time with a small group of photography enthusiasts I had met at my hotel. We spread out along the shore, each claiming our spot for the night's show.

The lights began early—around 9 PM—and continued until nearly 3 AM. Wave after wave of green and purple aurora painted the sky, some formations so bright they cast shadows on the ice below. At one point, the entire sky was alive with color, creating a natural dome of light that made us feel like we were inside a giant snow globe.

## More Than Just Lights

Chasing the northern lights taught me lessons that extend far beyond astronomy and photography:

**Patience Pays Off**: The best experiences often require waiting, sometimes in uncomfortable conditions. The anticipation makes the payoff even more rewarding.

**Embrace the Unexpected**: My most spectacular aurora viewing happened when I least expected it. Sometimes the best travel moments can't be planned.

**Disconnect to Connect**: Standing under the northern lights, hours from the nearest WiFi signal, I felt more connected to the natural world than I had in years.

**Share the Wonder**: The camaraderie among aurora chasers is special. Strangers become friends when you're all sharing the same sense of awe under a dancing sky.

## The Science and the Soul

Learning about the science behind the aurora—solar particles interacting with Earth's magnetic field—didn't diminish the magic for me. If anything, understanding the cosmic forces at play made the experience even more profound.

These lights have been dancing across Arctic skies for millions of years, witnessed by Vikings, Inuit hunters, and countless others who looked up in wonder. I was part of an ancient human tradition: standing small under an vast sky, marveling at forces beyond our control.

## Planning Your Own Aurora Adventure

If you're inspired to chase the northern lights yourself, here's what I learned:

- **Timing is everything**: Visit during aurora season (September to March) and plan for at least 3-4 nights to account for weather
- **Get away from lights**: The darker your location, the better your viewing chances
- **Be prepared for cold**: Dress in layers and bring hand warmers—you'll be standing still for hours
- **Manage expectations**: Some nights you'll see nothing. Other nights will take your breath away
- **Bring a good camera**: Phone cameras won't capture the aurora well. A DSLR with manual settings is essential

## The Memory That Lasts

Months later, I still think about those three nights in Iceland almost daily. There's something about the northern lights that stays with you—maybe it's the reminder of how small we are in the cosmic scheme, or maybe it's the pure joy of witnessing something so beautiful it seems impossible.

Iceland taught me that some experiences are worth traveling to the ends of the earth for. The northern lights aren't just a natural phenomenon; they're a reminder that magic still exists in our world, dancing across the sky for anyone patient enough to look up.
    `,
    author: "Travel Blogger",
    date: "2024-02-28",
    location: "Reykjavik, Iceland",
    category: "Adventure",
    tags: ["Iceland", "Northern Lights", "Adventure", "Photography"],
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&h=600&fit=crop&auto=format",
    readTime: "6 min"
  },
  {
    id: 3,
    title: "Street Food Adventures in Bangkok",
    excerpt: "From floating markets to hidden alleyway stalls, discovering Thailand's incredible culinary soul.",
    content: `
# Street Food Adventures in Bangkok

Bangkok hits you like a wave of sensory overload—the sounds of tuk-tuks weaving through traffic, the aroma of sizzling garlic and chilies, the kaleidoscope of colors from fruit vendors and fabric markets. But nothing prepared me for the incredible journey through Thailand's street food culture, where every meal tells a story and every vendor is an artist.

## The Floating Market Discovery

My culinary adventure began at dawn at the Damnoen Saduak floating market, about an hour outside Bangkok. As our long-tail boat navigated the narrow canals, I watched vendors preparing fresh coconut ice cream, grilling satay over charcoal, and ladling steaming noodle soup from boats that doubled as floating kitchens.

The first vendor I encountered was an elderly woman making mango sticky rice in a boat barely larger than a canoe. Her hands moved with practiced precision, slicing perfectly ripe mangoes and arranging them beside glutinous rice soaked in coconut milk. The sweet, creamy combination was the perfect introduction to Thai flavors—a harmonious balance of textures and tastes that would define my entire journey.

## The Art of Pad Thai

Everyone knows pad thai, but I discovered there's a world of difference between the restaurant version and what you'll find on Bangkok's streets. I spent an afternoon with Khun Somchai, a pad thai master who has been working the same corner in Chinatown for over 30 years.

Watching him work was like observing a conductor leading an orchestra. The rhythmic scraping of his spatula against the wok, the precise timing of adding ingredients, the way he could gauge doneness by sound alone—it was culinary poetry in motion.

"Secret is the wok heat," he told me in broken English, wiping sweat from his forehead as flames licked the sides of his well-seasoned pan. "Too low, noodles stick. Too high, noodles burn. Must be just right."

His pad thai was a revelation—tangy from tamarind, slightly sweet from palm sugar, with a hint of fish sauce umami and the crunch of fresh bean sprouts and crushed peanuts. Simple ingredients transformed into something extraordinary through technique passed down through generations.

## Late Night Food Adventures

The real magic happens after dark when Bangkok's street food scene truly comes alive. I joined a food tour that didn't end until 2 AM, winding through narrow alleyways where the city's culinary secrets hide.

In one tiny soi (alley), we found a grandmother making som tam (papaya salad) by pounding fresh ingredients in a massive mortar and pestle. The sound echoed off the surrounding buildings—thock, thock, thock—as she created a salad that was simultaneously sweet, sour, salty, and spicy.

Further down the same alley, a family-run stall was serving tom yum goong that had locals queuing for hours. The broth was a perfect balance of lemongrass, galangal, lime leaves, and chilies, with plump prawns that had been swimming in tanks just hours before.

## The Philosophy of Thai Street Food

What struck me most about Bangkok's street food culture wasn't just the incredible flavors—it was the philosophy behind it. Food vendors aren't just feeding people; they're preserving traditions, supporting families, and creating community gathering places.

I met vendors who had learned their recipes from grandparents, who woke at 4 AM to prepare fresh ingredients, who took pride in perfecting a single dish rather than expanding their menu. There's a deep respect for ingredients, technique, and the relationship between cook and customer.

One vendor selling grilled fish told me, "I make only fish, but I make best fish. People come from across city for my fish. Why I need make other things?"

## The Spice Education

Thai food taught me to recalibrate my understanding of spice. It's not about heat for heat's sake—it's about balance. The burn of chilies is tempered by cooling herbs, sharp acidity is balanced by palm sugar sweetness, and rich coconut milk smooths everything into harmony.

I learned to identify different chilies: the tiny bird's eye chilies that pack serious heat, the longer red chilies that add color and moderate spice, the dried chilies that bring smoky depth to curry pastes. Each has its place and purpose.

## Market Mornings

Some of my favorite food experiences happened in the early morning markets where locals shop for their daily ingredients. The flower market was a feast for the senses—jasmine garlands for Buddhist shrines, orchids in every color imaginable, and the heady perfume of frangipani filling the air.

But the food markets were where the real action was. I watched vendors selecting the best fish, haggling over produce prices, and sampling everything before buying. The quality standards were incredibly high—these people cook fresh every day and know good ingredients when they see them.

## Dessert Discoveries

Thai desserts were a revelation I hadn't expected. Mango sticky rice is just the beginning. I discovered kanom krok (coconut rice pancakes), tub tim krob (water chestnuts in coconut milk), and countless varieties of traditional sweets made from coconut, rice, and tropical fruits.

One of my favorite discoveries was Thai-style shaved ice desserts loaded with young coconut, sweet corn, red beans, and palm sugar syrup. It sounds unusual but tastes like summer itself—refreshing, sweet, and utterly addictive in Bangkok's sweltering heat.

## The Social Aspect

Street food in Bangkok isn't just about eating—it's about socializing. Food stalls become neighborhood gathering places where people catch up on gossip, watch Thai soap operas on tiny TVs, and debate politics over bowls of noodles.

I was adopted by regulars at several stalls, invited to share tables, taught proper eating etiquette, and included in conversations despite our language barriers. Food became the universal language that connected us.

## Lessons from the Street

My Bangkok street food adventure taught me lessons that extend far beyond cooking:

**Simplicity creates excellence**: The best dishes often have the fewest ingredients, executed perfectly
**Tradition has value**: Recipes passed down through generations carry wisdom worth preserving
**Community matters**: Food brings people together across all cultural boundaries
**Quality over quantity**: It's better to master one thing than to be mediocre at many

## Bringing Bangkok Home

I returned from Thailand with a suitcase full of ingredients and a head full of techniques. While I can't recreate the exact magic of eating pad thai on a plastic stool next to a Bangkok street, I can honor the lessons I learned about respecting ingredients, balancing flavors, and cooking with love.

The vendors of Bangkok taught me that great food isn't about fancy equipment or expensive ingredients—it's about understanding your craft, respecting your traditions, and feeding people with joy. Every time I smell lemongrass or taste good fish sauce, I'm transported back to those magical nights wandering through the city's endless maze of delicious possibilities.

Bangkok's street food scene isn't just about eating—it's about experiencing the soul of a culture through its most essential expression: the food that brings people together, tells stories, and keeps traditions alive one delicious bite at a time.
    `,
    author: "Travel Blogger",
    date: "2024-02-14",
    location: "Bangkok, Thailand",
    category: "Culinary Journey",
    tags: ["Thailand", "Food", "Street Food", "Culture"],
    image: "https://images.unsplash.com/photo-1552566634-75bf769b8b4c?w=1200&h=600&fit=crop&auto=format",
    readTime: "5 min"
  }
  // Add more posts as needed...
];

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find(p => p.id === parseInt(id || '0'));

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 font-serif">Story Not Found</h1>
          <Link to="/blog" className="text-blue-600 hover:underline">
            ← Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  useSeoMeta({
    title: `${post.title} - Wanderlust Chronicles`,
    description: post.excerpt,
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

      {/* Back Navigation */}
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/blog" 
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Stories</span>
          </Link>
        </div>
      </div>

      {/* Article Hero */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Hero Image */}
        <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Header */}
        <header className="mb-8">
          {/* Meta info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                {post.category}
              </span>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{post.location}</span>
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
            <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6 font-serif">
            {post.title}
          </h1>

          {/* Author and excerpt */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">{post.author}</span>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full"
              >
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none prose-gray dark:prose-invert">
          <div className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
            {post.content}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
          <CommentsSection 
            root={new URL(`${window.location.origin}/blog/${post.id}`)}
            title="Share Your Thoughts"
            emptyStateMessage="No comments yet"
            emptyStateSubtitle="Be the first to share your travel experiences!"
          />
        </div>
      </article>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 mt-16">
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

export default BlogPost;