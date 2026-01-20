import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-primary wave-animation" />
              <span className="font-bold text-lg">MojoBus</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Perpetual Traveler – Unser Leben am Meer. Freiheit, Abenteuer und Einfachheit zwischen Sand und Horizont.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">#offgridlife</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">#beachlife</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">#vanlife</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">#oceanview</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">#btc</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold">Navigation</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/artikel" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Artikel
              </Link>
              <Link to="/notes" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Notes
              </Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Kontakt</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>⚡ Lightning: wiseboot30@zeusnuts.com</p>
              <p>🔑 NIP-05: mojomojo@iris.to</p>
              <p>🌐 Web: mojobus.org</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} MojoBus. Veröffentlicht auf Nostr – dezentral und zensurresistent.</p>
          <p className="mt-2">
            <a 
              href="https://soapbox.pub/mkstack" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Vibed with MKStack
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
