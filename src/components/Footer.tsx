import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-lg" />
                <Waves className="h-8 w-8 text-primary wave-animation relative" />
              </div>
              <span className="font-bold text-xl">MojoBus</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Perpetual Traveler – Unser Leben am Meer. Freiheit, Abenteuer und Einfachheit zwischen Sand und Horizont.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">#offgridlife</span>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">#beachlife</span>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">#vanlife</span>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">#rvlife</span>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">#oceanview</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-6">
            <h3 className="font-semibold text-base">Navigation</h3>
            <nav className="flex flex-col space-y-3">
              <Link to="/" className="text-sm text-muted-foreground hover:text-[#ec1a58] transition-colors">
                Home
              </Link>
              <Link to="/artikel" className="text-sm text-muted-foreground hover:text-[#ec1a58] transition-colors">
                Artikel
              </Link>
              <Link to="/notes" className="text-sm text-muted-foreground hover:text-[#ec1a58] transition-colors">
                Notes
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-[#ec1a58] transition-colors">
                About
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h3 className="font-semibold text-base">Kontakt</h3>
            <div className="text-sm text-muted-foreground space-y-3">
              <p className="flex items-center gap-2">
                <span className="text-primary">⚡</span>
                <span>Lightning: wiseboot30@zeusnuts.com</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-primary">🔑</span>
                <span>NIP-05: mojo@mojobus.co</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground space-y-3">
          <p>© {currentYear} MojoBus. Veröffentlicht auf Nostr – dezentral und zensurresistent.</p>
          <p>
            <a
              href="https://soapbox.pub/mkstack"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors font-medium"
            >
              Vibed with MKStack
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
