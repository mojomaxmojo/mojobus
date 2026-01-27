import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { OfflineBanner } from '@/components/ServiceWorkerStatus';
import { InlineLoader } from '@/components/ui/loading-spinner';
import { useIsFetching } from '@tanstack/react-query';
import {
  Menu,
  X,
  PenSquare,
  User,
  Settings,
  LogOut,
  MapPin,
  Home,
  FileText,
  Info,
  Images,
  ChevronDown,
  Flag,
  Camera,
  StickyNote,
  Dog,
  Wrench,
  Mountain,
  Calendar,
  Lightbulb,
  Sun,
} from '@/lib/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { MAIN_MENU } from '@/config';

export function Header() {
  const { user, isLoading } = useCurrentUser();
  const { logout } = useLoginActions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const editEventId = searchParams.get('edit');
  const editType = searchParams.get('type');
  const [activeTab, setActiveTab] = useState(editType || 'note');

  // Global fetching state - zeigt Spinner an, wenn irgendeine Nostr Query läuft
  const isFetching = useIsFetching();

  const handleMobileMenuClick = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  // Icon mapping for Nature categories
  const getNatureIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'strand': return Camera; // temporarily use Camera
      case 'berge': return Mountain;
      case 'see': return Camera; // temporarily use Camera
      case 'wald': return Camera; // temporarily use Camera
      case 'wasserfall': return Camera; // temporarily use Camera
      case 'wiese': return Sun;
      case 'tiere': return Camera;
      default: return Camera;
    }
  };

  return (
    <>
      <OfflineBanner />
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:bg-gray-900/95">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center">
            {/* Logo & Mobile Menu Toggle */}
            <Link to="/" className="inline-flex items-center">
              <img
                  src="/mojobuslogo.png"
                  alt="MojoBus Logo"
                  width="250"
                  height="176"
                  style={{ objectFit: 'contain', display: 'block', background: 'transparent' }}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3 flex-1 justify-end">
              {/* Home */}
              <Link
                to="/"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Home
              </Link>

              {/* Nature Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Natur & Erlebnis
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      🚐 RV Life
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to="/artikel/rvlife/kuche-essen" className="flex items-center gap-2">
                          <span>🍳</span>
                          Küche & Essen
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/artikel/rvlife/unterkunft" className="flex items-center gap-2">
                          <span>🏠</span>
                          Unterkunft
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/artikel/rvlife/frei-living" className="flex items-center gap-2">
                          <span>🕊️</span>
                          Freeliving
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/artikel/rvlife/solar" className="flex items-center gap-2">
                          <span>☀️</span>
                          Solar & Offgrid
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/artikel/rvlife/freizeit" className="flex items-center gap-2">
                          <span>🎉</span>
                          Freizeit & Spaß
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Länder & Orte
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to="/plaetze" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Alle Orte
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          🇵🇹 Portugal
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem asChild>
                            <Link to="/plaetze/portugal" className="flex items-center gap-2">
                              🇵🇹 Portugal
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          🇪🇸 Spanien
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem asChild>
                            <Link to="/plaetze/spanien" className="flex items-center gap-2">
                              🇪🇸 Spanien
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          🇫🇷 Frankreich
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem asChild>
                            <Link to="/plaetze/frankreich" className="flex items-center gap-2">
                              🇫🇷 Frankreich
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* DIY */}
              <Link
                to="/artikel/diy"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                DIY & Basteln
              </Link>

              {/* Leon */}
              <Link
                to="/artikel/leon"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Leon
              </Link>

              {/* Notes */}
              <Link
                to="/notes"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Notes
              </Link>

              {/* Global Loading Indicator */}
              {isFetching && (
                <div className="flex items-center gap-2 ml-4">
                  <InlineLoader text="Lade..." />
                </div>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Desktop: User & Settings */}
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Avatar className="h-9 w-9">
                            {user.metadata?.picture ? (
                              <AvatarImage src={user.metadata.picture} alt={user.metadata.name || 'User'} />
                            ) : (
                              <AvatarFallback>{user.metadata?.name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                            )}
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                          {user.metadata?.name || 'User'}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile">
                            <User className="mr-2 h-4 w-4" />
                            Profil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Einstellungen
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/veroeffentlichen/modern">
                            <PenSquare className="mr-2 h-4 w-4" />
                            Neuer Beitrag
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/about">
                            <Info className="mr-2 h-4 w-4" />
                            Über uns
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Abmelden
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <LoginArea />
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Content */}
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menü</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile Loading Indicator */}
            {isFetching && (
              <div className="mb-6">
                <InlineLoader text="Lade von Nostr Relays..." />
              </div>
            )}

            {/* Mobile User Info */}
            {user ? (
              <div className="flex items-center gap-3 mb-6 p-4 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  {user.metadata?.picture ? (
                    <AvatarImage src={user.metadata.picture} alt={user.metadata.name || 'User'} />
                  ) : (
                    <AvatarFallback className="text-lg">{user.metadata?.name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.metadata?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.metadata?.nip05 || user.npub?.slice(0, 12) + '...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <LoginArea />
              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              <Link
                to="/"
                onClick={handleMobileMenuClick}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Home className="h-5 w-5" />
                Home
              </Link>

              <Link
                to="/artikel"
                onClick={handleMobileMenuClick}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <FileText className="h-5 w-5" />
                Artikel
              </Link>

              <Link
                to="/plaetze"
                onClick={handleMobileMenuClick}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <MapPin className="h-5 w-5" />
                Orte
              </Link>

              <Link
                to="/bilder"
                onClick={handleMobileMenuClick}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Images className="h-5 w-5" />
                Bilder
              </Link>

              <Link
                to="/notes"
                onClick={handleMobileMenuClick}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <StickyNote className="h-5 w-5" />
                Notes
              </Link>

              {user && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <Link
                      to="/veroeffentlichen/modern"
                      onClick={handleMobileMenuClick}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <PenSquare className="h-5 w-5" />
                      Neuer Beitrag
                    </Link>

                    <Link
                      to="/profile"
                      onClick={handleMobileMenuClick}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5" />
                      Profil
                    </Link>

                    <Link
                      to="/settings"
                      onClick={handleMobileMenuClick}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      Einstellungen
                    </Link>

                    <Link
                      to="/about"
                      onClick={handleMobileMenuClick}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Info className="h-5 w-5" />
                      Über uns
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        handleMobileMenuClick();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      Abmelden
                    </button>
                  </div>
                </>
              )}
            </nav>

            {/* Mobile Categories */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm font-medium mb-3 px-3">Kategorien</p>
              <div className="space-y-1">
                <Link
                  to="/artikel/diy"
                  onClick={handleMobileMenuClick}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Wrench className="h-5 w-5" />
                  DIY & Basteln
                </Link>

                <Link
                  to="/artikel/leon"
                  onClick={handleMobileMenuClick}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Dog className="h-5 w-5" />
                  Leon
                </Link>

                <Link
                  to="/artikel/rvlife"
                  onClick={handleMobileMenuClick}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Camera className="h-5 w-5" />
                  RV Life
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
