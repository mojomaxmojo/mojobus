import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLoginActions } from '@/hooks/useLoginActions';
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
} from 'lucide-react';
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
          <nav className="hidden md:flex items-center gap-3 flex-1 justify-end">
            {/* Home */}
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>

            {/* Artikel mit Sub-Menü */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 px-2 py-1.5 rounded-md text-sm font-medium transition-colors">
                  <FileText className="h-4 w-4" />
                  Artikel
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/artikel" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Alle Artikel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Nach Länder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {Object.values(MAIN_MENU.countries).map((country) => (
                      <DropdownMenuItem key={country.code} asChild>
                        <Link to={`/artikel/${country.code}`} className="flex items-center gap-2">
                          <span className="text-lg">{country.flag}</span>
                          {country.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    🛠️ DIY
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    {Object.values(MAIN_MENU.diy).map((category) => (
                      <DropdownMenuItem key={category.id} asChild>
                        <Link to={`/artikel/diy/${category.id}`} className="flex items-center gap-2">
                          <span>{category.emoji}</span>
                          {category.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/artikel/leon" className="flex items-center gap-2">
                    <Dog className="h-4 w-4" />
                    <span>🦁</span>
                    Leon Story
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    🚐 RV Life
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/artikel/rvlife/kueche-essen" className="flex items-center gap-2">
                        <span>🍳</span>
                        Küche & Essen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/artikel/rvlife/ausstattung" className="flex items-center gap-2">
                        <span>🏠</span>
                        Ausstattung
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/artikel/rvlife/freeliving" className="flex items-center gap-2">
                        <span>🕊️</span>
                        Freeliving
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Plätze */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-ocean-600 dark:text-ocean-300 hover:text-ocean-700 dark:hover:text-ocean-400 px-2 py-1.5 rounded-md text-sm font-semibold transition-colors">
                  <MapPin className="h-4 w-4" />
                  Plätze
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/plaetze" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Alle Plätze
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Nach Länder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {Object.values(MAIN_MENU.countries).map((country) => (
                      <DropdownMenuItem key={country.code} asChild>
                        <Link to={`/plaetze/${country.code}`} className="flex items-center gap-2">
                          <span className="text-lg">{country.flag}</span>
                          {country.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Nach Typen
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/plaetze/campingplatz" className="flex items-center gap-2">
                        <span className="text-lg">🏕️</span>
                        <span className="text-gray-900 dark:text-gray-100">Campingplatz</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/plaetze/wildcamping" className="flex items-center gap-2">
                        <span className="text-lg">🌲</span>
                        <span className="text-gray-900 dark:text-gray-100">Wildcamping</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/plaetze/stellplatz" className="flex items-center gap-2">
                        <span className="text-lg">🅿️</span>
                        <span className="text-gray-900 dark:text-gray-100">Stellplatz</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/plaetze/aussichtspunkt" className="flex items-center gap-2">
                        <span className="text-lg">👁️</span>
                        <span className="text-gray-900 dark:text-gray-100">Aussichtspunkt</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/plaetze/strand" className="flex items-center gap-2">
                        <span className="text-lg">🏖️</span>
                        <span className="text-gray-900 dark:text-gray-100">Strand</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bilder */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 px-2 py-1.5 rounded-md text-sm font-medium transition-colors">
                  <Camera className="h-4 w-4" />
                  Bilder
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/bilder" className="flex items-center gap-2">
                    <Images className="h-4 w-4" />
                    Alle Bilder
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Nach Länder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {Object.values(MAIN_MENU.countries).map((country) => (
                      <DropdownMenuItem key={country.code} asChild>
                        <Link to={`/bilder/${country.code}`} className="flex items-center gap-2">
                          <span className="text-lg">{country.flag}</span>
                          {country.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Natur
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    {Object.values(MAIN_MENU.nature).map((category) => (
                      <DropdownMenuItem key={category.id} asChild>
                        <Link to={`/bilder/natur/${category.id}`} className="flex items-center gap-2">
                          <span>{category.emoji}</span>
                          {category.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notes */}
            <Link
              to="/notes"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <StickyNote className="h-4 w-4" />
              Notes
            </Link>

            {/* About */}
            <Link
              to="/about"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-ocean-600 dark:hover:text-ocean-400 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              <Info className="h-4 w-4" />
              About
            </Link>
          </nav>

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
  );
}