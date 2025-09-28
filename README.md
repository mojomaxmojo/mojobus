# Personal Blog Template

A modern, customizable personal blog built with React, TypeScript, TailwindCSS, and Nostr protocols.

## ✨ Features

- **Modern Design** - Clean, responsive design with dark/light mode support
- **Blog System** - Full-featured blog with posts, categories, and tags
- **Nostr Integration** - Decentralized commenting system using Nostr protocol
- **SEO Optimized** - Proper meta tags and semantic markup
- **Performance** - Fast loading with modern build tools
- **Responsive** - Works beautifully on mobile, tablet, and desktop

## 🚀 Quick Start

1. **Customize the content** in these files:
   - `src/pages/Index.tsx` - Homepage content and branding
   - `src/pages/About.tsx` - About page with your information
   - `src/pages/Blog.tsx` & `src/pages/BlogPost.tsx` - Blog posts data

2. **Update branding** throughout the site:
   - Replace "My Blog" with your actual blog name
   - Update "Blog Author" with your name
   - Replace placeholder email and social links

3. **Add your content**:
   - Replace the sample blog posts with your own content
   - Update the author photo and hero images
   - Customize the topics and interests sections

## 📝 Customizing Blog Posts

Blog posts are currently stored as static data in the components. To add new posts:

1. **Add to the `blogPosts` array** in both `src/pages/Blog.tsx` and `src/pages/BlogPost.tsx`
2. **Include these fields**:
   - `id` - Unique identifier
   - `title` - Post title
   - `excerpt` - Short description for previews
   - `content` - Full markdown/text content
   - `author` - Author name
   - `date` - Publication date (YYYY-MM-DD format)
   - `category` - Post category
   - `tags` - Array of tags
   - `image` - Hero image URL
   - `readTime` - Estimated reading time

## 🎨 Styling & Theming

The blog uses TailwindCSS for styling with a custom color scheme:

- **Primary Colors**: Blue accent with slate/gray base
- **Dark Mode**: Automatic dark mode support
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Built with shadcn/ui component library

To customize colors, edit the CSS custom properties in `src/index.css`.

## 🔧 Technical Stack

- **React 18** - Modern React with hooks and concurrent rendering
- **TypeScript** - Type-safe JavaScript development
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server
- **Nostr** - Decentralized commenting system
- **React Router** - Client-side routing
- **shadcn/ui** - Accessible UI components

## 🎯 Key Pages

- **`/`** - Homepage with hero section and recent posts
- **`/blog`** - Blog listing with all posts
- **`/blog/:id`** - Individual blog post pages
- **`/about`** - About page with author information

## 📧 Contact & Social Links

Update the contact information in `src/pages/About.tsx`:

- Email address
- Website URL  
- Social media links (GitHub, Twitter, etc.)
- Nostr public key (if applicable)

## 🔒 Privacy & Decentralization

This blog embraces privacy-first principles:

- **Nostr Comments** - Decentralized commenting system
- **No Tracking** - No analytics or tracking by default
- **Static Hosting** - Can be hosted anywhere
- **Open Source** - Fully customizable and transparent

## 🚀 Deployment

The blog builds to static files and can be deployed anywhere:

```bash
npm run build
```

The `dist` folder contains all files needed for deployment.

## 🤝 Contributing

This is a template designed to be customized. Feel free to:

- Modify the design and layout
- Add new features or pages
- Improve the blog post system
- Enhance the Nostr integration

## 📄 License

This template is open source and available for anyone to use and customize.

---

**Built with ❤️ using React and Nostr protocols**

*Vibed with [MKStack](https://soapbox.pub/mkstack)*