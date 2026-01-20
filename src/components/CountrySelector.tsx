import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

interface CountryOption {
  value: string;
  label: string;
  flag: string;
}

const countries: CountryOption[] = [
  { value: 'portugal', label: 'Portugal', flag: '🇵🇹' },
  { value: 'spanien', label: 'Spanien', flag: '🇪🇸' },
  { value: 'frankreich', label: 'Frankreich', flag: '🇫🇷' },
  { value: 'belgien', label: 'Belgien', flag: '🇧🇪' },
  { value: 'deutschland', label: 'Deutschland', flag: '🇩🇪' },
  { value: 'luxemburg', label: 'Luxemburg', flag: '🇱🇺' },
];

interface CountrySelectorProps {
  selectedCountry?: string;
  onCountryChange: (country: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelector({
  selectedCountry,
  onCountryChange,
  placeholder = "Land auswählen",
  className
}: CountrySelectorProps) {
  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onCountryChange(undefined);
    } else {
      onCountryChange(value);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Select value={selectedCountry || 'none'} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">Kein Land</span>
          </SelectItem>
          {countries.map((country) => (
            <SelectItem key={country.value} value={country.value}>
              <span className="flex items-center gap-2">
                <span className="text-lg">{country.flag}</span>
                {country.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCountry && (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="gap-1">
            <span className="text-sm">
              {countries.find(c => c.value === selectedCountry)?.flag}
            </span>
            {countries.find(c => c.value === selectedCountry)?.label}
          </Badge>
        </div>
      )}
    </div>
  );
}

// Export für direkte Verwendung
export const countryOptions = countries;

// Hilfsfunktion: Konvertiert Land-Code zu Tag
export function getCountryTag(countryCode?: string): string[] {
  if (!countryCode) return [];

  const country = countries.find(c => c.value === countryCode);
  if (!country) return [];

  // Nur das Land ohne # zurückgeben (wird beim Anzeigen als Hashtag gerendert)
  return [country.value];
}