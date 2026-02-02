import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-primary/20 bg-gradient-to-b from-background to-primary/5 min-h-[200px] contain-layout">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {/* Brand */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <img
                src="/icon-96x96.png"
                alt="MojoBus Logo"
                width="50"
                height="50"
                className="h-14 w-14 object-contain hover:scale-110 transition-transform duration-300"
              />
              <span className="font-bold text-2xl gradient-text">MojoBus</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Perpetual Traveler – Unser Leben am Meer. Freiheit, Abenteuer und Einfachheit zwischen Sand und Horizont.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 font-medium hover:bg-primary/20 transition-colors cursor-default">#offgridlife</span>
              <span className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 font-medium hover:bg-primary/20 transition-colors cursor-default">#beachlife</span>
              <span className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 font-medium hover:bg-primary/20 transition-colors cursor-default">#vanlife</span>
              <span className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 font-medium hover:bg-primary/20 transition-colors cursor-default">#rvlife</span>
              <span className="text-xs bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20 font-medium hover:bg-primary/20 transition-colors cursor-default">#oceanview</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-8">
            <h3 className="font-bold text-xl">Navigation</h3>
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-base text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1">
                Home
              </Link>
              <Link to="/artikel" className="text-base text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1">
                Artikel
              </Link>
              <Link to="/notes" className="text-base text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1">
                Notes
              </Link>
              <Link to="/about" className="text-base text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1">
                About
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-8">
            <h3 className="font-bold text-xl">Kontakt</h3>
            <div className="text-sm text-muted-foreground space-y-4">
              <p className="flex items-center gap-3 text-base">
                <span className="text-primary text-xl">⚡</span>
                <span>Lightning: wiseboot30@zeusnuts.com</span>
              </p>
              <p className="flex items-center gap-3 text-base">
                <span className="text-primary text-xl">🔑</span>
                <span>NIP-05: mojo@mojobus.co</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-primary/20 text-center text-sm text-muted-foreground">
          <p>© {currentYear} MojoBus. Veröffentlicht auf Nostr – dezentral und zensurresistent.</p>
        </div>
      </div>
    </footer>
  );
}
