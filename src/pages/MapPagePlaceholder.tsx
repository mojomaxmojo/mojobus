/**
 * Map Page Placeholder
 * 
 * Shown in Shakespeare development environment
 * Real map with Leaflet works in production
 */

import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from '@/lib/icons';

export default function MapPagePlaceholder() {
  return (
    <>
      {/* Page Header mit Gradient Background */}
      <section className="relative py-6 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="gradient-text">🗺️ Europa Map</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              GPS-aktivierte Beiträge auf einer interaktiven Karte
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-8">
        <Card className="border-dashed">
          <CardContent className="py-12 px-8 text-center">
            <div className="max-w-sm mx-auto space-y-6">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium mb-2">Karte in Entwicklung nicht verfügbar</h3>
                <p className="text-muted-foreground">
                  Die Leaflet-Bibliothek kann in Shakespeare's Build-System nicht geladen werden.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Die echte interaktive Karte mit allen GPS-Standorten funktioniert perfekt in der Produktion auf mojobus.co.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
