import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Home,
  FileText,
  Info,
  Flag,
  MapPin,
  Camera,
  StickyNote,
  Dog,
  Wrench,
  PenSquare,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import { COUNTRIES } from '@/config';

interface MobileNavigationProps {
  user?: any;
  onMobileMenuClick: () => void;
}

export function MobileNavigation({ user, onMobileMenuClick }: MobileNavigationProps) {
  return (
    <nav className="space-y-1">
      {/* Mobile Home */}
      <Link
        to="/"
        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
        onClick={onMobileMenuClick}
      >
        <Home className="h-5 w-5 text-gray-600" />
        <span className="text-gray-900 dark:text-gray-100">Home</span>
      </Link>

      {/* Mobile Artikel */}
      <div className="space-y-1">
        <Link
          to="/artikel"
          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
          onClick={onMobileMenuClick}
        >
          <FileText className="h-5 w-5 text-gray-600" />
          <span className="text-gray-900 dark:text-gray-100">Alle Artikel</span>
        </Link>
        <div className="ml-8 space-y-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
            Nach Länder
          </div>
          {Object.values(COUNTRIES).map((country) => (
            <Link
              key={country.code}
              to={`/artikel/${country.code}`}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">{country.flag}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{country.name}</span>
            </Link>
          ))}
          <div className="ml-8 space-y-1 mt-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
              🛠️ DIY & Anleitungen
            </div>
            <Link
              to="/artikel/diy"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <Wrench className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-900 dark:text-gray-100">Alle DIY-Anleitungen</span>
            </Link>
            <Link
              to="/artikel/diy/LiFePo4"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">🔋</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">LiFePo4 Systeme</span>
            </Link>
            <Link
              to="/artikel/diy/solar"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">☀️</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">Solaranlagen</span>
            </Link>
            <Link
              to="/artikel/diy/reparatur"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">🔧</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">Reparaturanleitungen</span>
            </Link>
            <Link
              to="/artikel/diy/ausbau"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">🛠️</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">Ausbau & Umbau</span>
            </Link>
            <Link
              to="/artikel/diy/technik"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">⚙️</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">Technik & Elektronik</span>
            </Link>
          </div>
          <div className="ml-8 space-y-1 mt-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
              🦁 Leon Story
            </div>
            <Link
              to="/artikel/leon"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <Dog className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-900 dark:text-gray-100">Leon Story</span>
            </Link>
            <Link
              to="/artikel/leon/abenteuer"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">⛰️</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">Abenteuer</span>
            </Link>
            <Link
              to="/artikel/leon/daily"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">📅</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">Leon Daily</span>
            </Link>
            <Link
              to="/artikel/leon/tips"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">💡</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">Tipps & Tricks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Plätze */}
      <div className="space-y-1">
        <Link
          to="/plaetze"
          className="flex items-center gap-3 p-2 bg-ocean-50 dark:bg-ocean-900 text-ocean-600 dark:text-ocean-100 rounded-lg"
          onClick={onMobileMenuClick}
        >
          <MapPin className="h-5 w-5" />
          <span className="text-ocean-600 dark:text-ocean-100">Alle Plätze</span>
        </Link>
        <div className="ml-8 space-y-1">
          <div className="text-xs font-semibold text-ocean-500 dark:text-ocean-400 px-2 py-1">
            Nach Ländern
          </div>
          {Object.values(COUNTRIES).map((country) => (
            <Link
              key={country.code}
              to={`/plaetze/${country.code}`}
              className="flex items-center gap-3 p-2 hover:bg-ocean-50 dark:hover:bg-ocean-900 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">{country.flag}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{country.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Bilder */}
      <div className="space-y-1">
        <Link
          to="/bilder"
          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
          onClick={onMobileMenuClick}
        >
          <Camera className="h-5 w-5 text-gray-600" />
          <span className="text-gray-900 dark:text-gray-100">Alle Bilder</span>
        </Link>
        <div className="ml-8 space-y-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
            Nach Länder
          </div>
          {Object.values(COUNTRIES).map((country) => (
            <Link
              key={country.code}
              to={`/bilder/${country.code}`}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">{country.flag}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{country.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Notes */}
      <div className="space-y-1">
        <Link
          to="/notes"
          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
          onClick={onMobileMenuClick}
        >
          <StickyNote className="h-5 w-5 text-gray-600" />
          <span className="text-gray-900 dark:text-gray-100">Alle Notes</span>
        </Link>
        <div className="ml-8 space-y-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">
            Nach Länder
          </div>
          {Object.values(COUNTRIES).map((country) => (
            <Link
              key={country.code}
              to={`/notes/${country.code}`}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <span className="text-sm">{country.flag}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{country.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile About */}
      <Link
        to="/about"
        className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
        onClick={onMobileMenuClick}
      >
        <Info className="h-5 w-5 text-gray-600" />
        <span className="text-gray-900 dark:text-gray-100">About</span>
      </Link>

      {user && (
        <>
          <div className="border-t dark:border-gray-700 my-2"></div>

          <div className="space-y-1">
            <Link
              to="/veroeffentlichen"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <PenSquare className="h-5 w-5 text-gray-600" />
              <span className="text-gray-900 dark:text-gray-100">Beitrag erstellen</span>
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-gray-900 dark:text-gray-100">Profil</span>
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={onMobileMenuClick}
            >
              <Settings className="h-5 w-5 text-gray-600" />
              <span className="text-gray-900 dark:text-gray-100">Einstellungen</span>
            </Link>
            <button
              className="flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg text-red-600"
              onClick={() => {
                // This would need the logout function
                if (window.confirm('Wirklich ausloggen?')) {
                  onMobileMenuClick();
                }
              }}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Ausloggen</span>
            </button>
          </div>
        </>
      )}
    </nav>
  );
}