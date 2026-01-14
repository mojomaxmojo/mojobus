import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
import { OfflineBanner } from '@/components/ServiceWorkerStatus';
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
  Flag,
  Camera,
  StickyNote,
  Dog,
  Wrench,
  Mountain,
  Calendar,
  Lightbulb,
  Sun,
  ChevronDown,
} from '@/lib/icons';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
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
          <NavigationMenu className="hidden md:flex flex-1 justify-end">
            <NavigationMenuList>
              {/* Home */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* Artikel mit Hover-Menü */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Artikel
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-56 p-2">
                    <NavigationMenuLink asChild className="block p-2 rounded-md hover:bg-accent">
                      <Link to="/artikel" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Alle Artikel
                      </Link>
                    </NavigationMenuLink>
                    <div className="my-1 border-t"></div>
                    <div className="py-1">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Nach Länder
                      </div>
                      {Object.values(MAIN_MENU.countries).map((country) => (
                        <NavigationMenuLink key={country.code} asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                          <Link to={`/artikel/${country.code}`} className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            {country.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                    <div className="my-1 border-t"></div>
                    <div className="py-1">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        🛠️ DIY
                      </div>
                      {Object.values(MAIN_MENU.diy).map((category) => (
                        <NavigationMenuLink key={category.id} asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                          <Link to={`/artikel/diy/${category.id}`} className="flex items-center gap-2">
                            <span>{category.emoji}</span>
                            {category.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                    <div className="my-1 border-t"></div>
                    <div className="py-1">
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/artikel/rvlife/kueche-essen" className="flex items-center gap-2">
                          <span>🍳</span>
                          Küche & Essen
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/artikel/rvlife/ausstattung" className="flex items-center gap-2">
                          <span>🏠</span>
                          Ausstattung
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/artikel/rvlife/freeliving" className="flex items-center gap-2">
                          <span>🕊️</span>
                          Freeliving
                        </Link>
                      </NavigationMenuLink>
                    </div>
                    <div className="my-1 border-t"></div>
                    <NavigationMenuLink asChild className="block p-2 rounded-md hover:bg-accent">
                      <Link to="/artikel/leon" className="flex items-center gap-2">
                        <Dog className="h-4 w-4" />
                        <span>🦁</span>
                        Leon Story
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Plätze */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center gap-2 text-ocean-600 dark:text-ocean-300 font-semibold">
                  <MapPin className="h-4 w-4" />
                  Plätze
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-48 p-2">
                    <NavigationMenuLink asChild className="block p-2 rounded-md hover:bg-accent">
                      <Link to="/plaetze" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Alle Plätze
                      </Link>
                    </NavigationMenuLink>
                    <div className="my-1 border-t"></div>
                    <div className="py-1">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Nach Länder
                      </div>
                      {Object.values(MAIN_MENU.countries).map((country) => (
                        <NavigationMenuLink key={country.code} asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                          <Link to={`/plaetze/${country.code}`} className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            {country.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                    <div className="my-1 border-t"></div>
                    <div className="py-1">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Nach Typen
                      </div>
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/plaetze/campingplatz" className="flex items-center gap-2">
                          <span className="text-lg">🏕️</span>
                          <span className="text-gray-900 dark:text-gray-100">Campingplatz</span>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/plaetze/wildcamping" className="flex items-center gap-2">
                          <span className="text-lg">🌲</span>
                          <span className="text-gray-900 dark:text-gray-100">Wildcamping</span>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/plaetze/stellplatz" className="flex items-center gap-2">
                          <span className="text-lg">🅿️</span>
                          <span className="text-gray-900 dark:text-gray-100">Stellplatz</span>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/plaetze/aussichtspunkt" className="flex items-center gap-2">
                          <span className="text-lg">👁️</span>
                          <span className="text-gray-900 dark:text-gray-100">Aussichtspunkt</span>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                        <Link to="/plaetze/strand" className="flex items-center gap-2">
                          <span className="text-lg">🏖️</span>
                          <span className="text-gray-900 dark:text-gray-100">Strand</span>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Bilder */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Bilder
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-56 p-2">
                    <NavigationMenuLink asChild className="block p-2 rounded-md hover:bg-accent">
                      <Link to="/bilder" className="flex items-center gap-2">
                        <Images className="h-4 w-4" />
                        Alle Bilder
                      </Link>
                    </NavigationMenuLink>
                    <div className="my-1 border-t"></div>
                    <div className="py-1">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Nach Länder
                      </div>
                      {Object.values(MAIN_MENU.countries).map((country) => (
                        <NavigationMenuLink key={country.code} asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                          <Link to={`/bilder/${country.code}`} className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            {country.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                    <div className="my-1 border-t"></div>
                    <div className="py-1">
                      <div className="px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Natur
                      </div>
                      {Object.values(MAIN_MENU.nature).map((category) => (
                        <NavigationMenuLink key={category.id} asChild className="block px-2 py-1.5 rounded-md hover:bg-accent">
                          <Link to={`/bilder/natur/${category.id}`} className="flex items-center gap-2">
                            <span>{category.emoji}</span>
                            {category.name}
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Notes */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/notes" className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* About */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/about" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    About
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* User Actions - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Account
                    <ChevronDown className="h-3 w-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/veroeffentlichen" className="flex items-center gap-2">
                      <PenSquare className="h-4 w-4" />
                      Beitrag erstellen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Einstellungen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Ausloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LoginArea />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={handleMobileMenuClick}
        >
          <div
            className="bg-white dark:bg-gray-900 w-80 max-w-[90%] h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menü</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-4 space-y-2">
              {/* Mobile Home */}
              <Link
                to="/"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                onClick={handleMobileMenuClick}
              >
                <Home className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900 dark:text-gray-100">Home</span>
              </Link>

              {/* Mobile Artikel */}
              <div className="space-y-1">
                <Link
                  to="/artikel"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={handleMobileMenuClick}
                >
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 dark:text-gray-100">Alle Artikel</span>
                </Link>
                <Link
                  to="/artikel/leon"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={handleMobileMenuClick}
                >
                  <Dog className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 dark:text-gray-100">Leon Story</span>
                </Link>
              </div>

              {/* Mobile Plätze */}
              <div className="space-y-1">
                <Link
                  to="/plaetze"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={handleMobileMenuClick}
                >
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 dark:text-gray-100">Alle Plätze</span>
                </Link>
              </div>

              {/* Mobile Bilder */}
              <div className="space-y-1">
                <Link
                  to="/bilder"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                  onClick={handleMobileMenuClick}
                >
                  <Camera className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 dark:text-gray-100">Alle Bilder</span>
                </Link>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
                  Nach Länder
                </div>
                <div className="space-y-2">
                  {Object.values(MAIN_MENU.countries).map((country) => (
                    <Link
                      key={country.code}
                      to={`/bilder/${country.code}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                      onClick={handleMobileMenuClick}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-gray-900 dark:text-gray-100">{country.name}</span>
                    </Link>
                  ))}
                </div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
                  Natur
                </div>
                <div className="space-y-2">
                  {Object.values(MAIN_MENU.nature).map((category) => (
                    <Link
                      key={category.id}
                      to={`/bilder/natur/${category.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                      onClick={handleMobileMenuClick}
                    >
                      <span>{category.emoji}</span>
                      <span className="text-gray-900 dark:text-gray-100">{category.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Notes */}
              <Link
                to="/notes"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                onClick={handleMobileMenuClick}
              >
                <StickyNote className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900 dark:text-gray-100">Alle Notes</span>
              </Link>

              {/* Mobile About */}
              <Link
                to="/about"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                onClick={handleMobileMenuClick}
              >
                <Info className="h-5 w-5 text-gray-600" />
                <span className="text-gray-900 dark:text-gray-100">About</span>
              </Link>

              {/* Mobile User Actions */}
              {user ? (
                <div className="border-t dark:border-gray-700 pt-4 mt-4 space-y-2">
                  <Link
                    to="/veroeffentlichen"
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={handleMobileMenuClick}
                  >
                    <PenSquare className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900 dark:text-gray-100">Beitrag erstellen</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={handleMobileMenuClick}
                  >
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900 dark:text-gray-100">Profil</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={handleMobileMenuClick}
                  >
                    <Settings className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900 dark:text-gray-100">Einstellungen</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      handleMobileMenuClick();
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg w-full text-left"
                  >
                    <LogOut className="h-5 w-5 text-red-600" />
                    <span className="text-red-600">Ausloggen</span>
                  </button>
                </div>
              ) : (
                <div className="border-t dark:border-gray-700 pt-4 mt-4">
                  <LoginArea />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}