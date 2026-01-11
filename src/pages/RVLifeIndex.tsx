/**
 * RV Life Index Page
 * Übersicht über alle RV Life Inhalte
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllCategories, getAllMenuCategories } from '@/config/extendedMenu';
import { Waves, Van, Cooking, MapPin, Compass, Home } from 'lucide-react';
import { memo } from 'react';
import type { MenuCategory } from '@/config/types';

function RVLifeIndex() {
  const rvLifeCategories = getAllMenuCategories().filter(cat => cat.id === 'rv-life');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background pt-[60px] pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-6">
              <Van className="h-16 w-16 text-primary wave-animation" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              RV Life
            </h1>
            <h2 className="text-2xl md:text-3xl text-muted-foreground">
              Alles rund ums Wohnmobil
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Willkommen bei RV Life – dein ultimativer Guide für das Leben im Wohnmobil.
              Von der perfekten Einrichtung über Solarenergie bis hin zu köstlichen Rezepten für den Campingkocher.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              <Badge className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                🚐 Wohnmobil
              </Badge>
              <Badge className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                ⚡ Elektronik
              </Badge>
              <Badge className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                🍳 Küche
              </Badge>
              <Badge className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                🔧 Werkstatt
              </Badge>
            </div>
            <div className="pt-6">
              <Button size="lg" className="gap-2">
                <Link to="/">
                  <Home className="h-5 w-5" />
                  Zur Startseite
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Kategorien
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rvLifeCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Warum RV Life?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Van className="h-12 w-12 text-primary" />}
                title="Professionell"
                description="Gewährte Experten-Tipps für dein Wohnmobil"
              />
              <FeatureCard
                icon={<Cooking className="h-12 w-12 text-primary" />}
                title="Praktisch"
                description="Getestete Rezepte und Küchen-Hacks"
              />
              <FeatureCard
                icon={<MapPin className="h-12 w-12 text-primary" />}
                title="Geprüft"
                description="Empfohlene Stellplätze und Reiseziele"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Fang an zu erstellen!
            </h2>
            <p className="text-lg text-muted-foreground">
              Teile dein Wissen mit der Community und erstelle deine eigenen Guides, Rezepte und Tipps.
            </p>
            <div className="pt-4">
              <Button size="lg" asChild>
                <Link to="/veroeffentlichen">
                  <Compass className="h-5 w-5 mr-2" />
                  Jetzt veröffentlichen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const CategoryCard = memo(function CategoryCard({ category }: { category: MenuCategory }) {
  const subCategories = category.children || [];

  return (
    <Link to={category.route} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="text-4xl">
              {category.icon}
            </div>
            <CardTitle className="text-2xl">{category.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{category.description || category.name}</p>
          <div className="space-y-2">
            {subCategories.slice(0, 3).map((subCat) => (
              <Badge key={subCat.id} variant="secondary" className="text-sm">
                {subCat.icon} {subCat.name}
              </Badge>
            ))}
            {subCategories.length > 3 && (
              <p className="text-sm text-muted-foreground">
                + {subCategories.length - 3} weitere...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

function FeatureCard({ icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export default RVLifeIndex;
