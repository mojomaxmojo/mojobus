/**
 * Neue Kosten-Ausgabe hinzufügen
 *
 * Form to add new cost entries with encryption
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCostTracker } from '@/hooks/useCostTracker';
import { COST_CATEGORIES, type CostFormData, type CostCategoryId } from '@/types/costs';
import { ArrowLeft, Plus, Loader2, MapPin, Calendar, Save } from '@/lib/icons';
import { useHead } from '@unhead/react';

export default function KostenNeu() {
  const navigate = useNavigate();
  const { addEntry, isAdding } = useCostTracker();

  // Form state
  const [formData, setFormData] = useState<CostFormData>({
    title: '',
    amount: 0,
    category: 'diesel',
    location: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // SEO Meta Tags
  useHead({
    title: 'Neue Ausgabe hinzufügen - Kosten-Tracker',
    meta: [
      { name: 'robots', content: 'noindex, nofollow' },
    ]
  });

  // Handle form input changes
  const handleChange = (field: keyof CostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    if (formData.amount <= 0) {
      newErrors.amount = 'Betrag muss größer als 0 sein';
    }
    if (!formData.date) {
      newErrors.date = 'Datum ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await addEntry(formData);
      navigate('/artikel/rvlife/kosten');
    } catch (error) {
      console.error('Failed to add cost entry:', error);
      setErrors({ submit: 'Eintrag konnte nicht gespeichert werden' });
    }
  };

  return (
    <>
      {/* Page Header */}
      <section className="relative py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Link to="/artikel/rvlife/kosten">
                <Button variant="ghost" size="sm" className="mb-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
              </Link>
              <h1 className="text-4xl md:text-6xl font-bold">
                <span className="gradient-text">💰 Neue Ausgabe</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Kosten erfassen und speichern
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ausgabe hinzufügen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Titel <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="z.B. Tanken bei BP"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Betrag (€) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ''}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                    placeholder="45.50"
                    className={errors.amount ? 'border-red-500' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Kategorie <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value as CostCategoryId)}
                    className="w-full p-2 border rounded-md"
                  >
                    {Object.entries(COST_CATEGORIES).map(([id, cat]) => (
                      <option key={id} value={id}>{cat.emoji} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ort
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="z.B. Lagos, Portugal"
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datum <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={errors.date ? 'border-red-500' : ''}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="z.B. 40 Liter Diesel auf dem Weg nach Sagres"
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Zusätzliche Informationen..."
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link to="/artikel/rvlife/kosten" className="flex-1">
                  <Button variant="outline" className="w-full" type="button">
                    Abbrechen
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Speichert...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Security Notice */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  🔒 <strong>Sicherheitshinweis:</strong> Deine Daten werden verschlüsselt (NIP-44) und können nur von dir und Susanne gelesen werden.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
