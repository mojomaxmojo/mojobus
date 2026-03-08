import React, { useState } from 'react';
import { BudgetEntry } from '@/types/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Gauge, Droplets } from 'lucide-react';
import { format } from 'date-fns';

// Einfache Haushaltskategorien
const BUDGET_CATEGORIES = [
  { id: 'lebensmittel', name: 'Lebensmittel', icon: '🛒' },
  { id: 'diesel', name: 'Diesel/Tankstoff', icon: '⛽' },
  { id: 'gesundheit', name: 'Gesundheit', icon: '💊' },
  { id: 'wohnen', name: 'Wohnen/Miete', icon: '🏠' },
  { id: 'strom', name: 'Strom', icon: '💡' },
  { id: 'internet', name: 'Internet/Telefon', icon: '📱' },
  { id: 'versicherung', name: 'Versicherung', icon: '🛡️' },
  { id: 'reparatur', name: 'Reparatur', icon: '🔧' },
  { id: 'freizeit', name: 'Freizeit', icon: '🎉' },
  { id: 'kleidung', name: 'Kleidung', icon: '👕' },
  { id: 'sonstiges', name: 'Sonstiges', icon: '📦' },
];

interface BudgetEntryFormProps {
  entry?: BudgetEntry;
  onSubmit: (data: Omit<BudgetEntry, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function BudgetEntryForm({ entry, onSubmit, onCancel, isSubmitting }: BudgetEntryFormProps) {
  // Lokaler State für alle Formularfelder
  const [date, setDate] = useState<Date>(entry ? new Date(entry.date * 1000) : new Date());
  const [amount, setAmount] = useState<string>(entry ? (Math.abs(entry.amount) / 100).toFixed(2) : '');
  const [category, setCategory] = useState<string>(entry?.category || '');
  const [description, setDescription] = useState<string>(entry?.description || '');
  
  // Tank-spezifische Felder
  const [fuelKm, setFuelKm] = useState<string>(entry?.fuelKm?.toString() || '');
  const [fuelLiters, setFuelLiters] = useState<string>(entry?.fuelLiters?.toString() || '');
  const [fuelFullTank, setFuelFullTank] = useState<boolean>(entry?.fuelFullTank ?? true);

  // Validierungsfehler
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = "Bitte wähle ein Datum";
    }

    if (!amount || amount.trim() === '') {
      newErrors.amount = "Bitte gib einen Betrag ein";
    } else if (isNaN(parseFloat(amount))) {
      newErrors.amount = "Bitte gib eine gültige Zahl ein";
    }

    if (!category) {
      newErrors.category = "Bitte wähle eine Kategorie";
    }

    if (!description || description.trim().length < 2) {
      newErrors.description = "Beschreibung muss mindestens 2 Zeichen haben";
    }

    // Tank-spezifische Validierung
    if (category === 'diesel') {
      if (!fuelKm || isNaN(parseFloat(fuelKm))) {
        newErrors.fuelKm = "Bitte gib den Kilometerstand ein";
      }
      if (!fuelLiters || isNaN(parseFloat(fuelLiters))) {
        newErrors.fuelLiters = "Bitte gib die getankten Liter ein";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Konvertiere Betrag zu Cent (immer positiv für Ausgaben)
    const amountInCent = Math.round(Math.abs(parseFloat(amount)) * 100);
    
    const entryData: Omit<BudgetEntry, 'id' | 'createdAt'> = {
      date: Math.floor(date.getTime() / 1000),
      amount: -amountInCent, // Negativ für Ausgaben
      currency: 'EUR',
      category: category,
      description: description,
      tags: [],
    };
    
    // Tank-spezifische Daten hinzufügen
    if (category === 'diesel') {
      entryData.fuelKm = parseFloat(fuelKm);
      entryData.fuelLiters = parseFloat(fuelLiters);
      entryData.fuelFullTank = fuelFullTank;
    }
    
    onSubmit(entryData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datum */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium leading-none">
          Datum
        </label>
        <div className="relative">
          <Input
            type="date"
            value={format(date, 'yyyy-MM-dd')}
            onChange={(e) => {
              const newDate = new Date(e.target.value + 'T00:00:00');
              if (!isNaN(newDate.getTime())) {
                setDate(newDate);
              }
            }}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="pr-10"
          />
          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {errors.date && (
          <p className="text-sm font-medium text-destructive">{errors.date}</p>
        )}
      </div>

      {/* Betrag */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Betrag (€)
        </label>
        <div className="relative">
          <Input
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0"
            className="pl-8"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            €
          </span>
        </div>
        {errors.amount && (
          <p className="text-sm font-medium text-destructive">{errors.amount}</p>
        )}
      </div>

      {/* Kategorie */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Kategorie
        </label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent>
            {BUDGET_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm font-medium text-destructive">{errors.category}</p>
        )}
      </div>

      {/* Tank-spezifische Felder - nur bei Kategorie "diesel" */}
      {category === 'diesel' && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Tankdaten
          </h4>
          
          {/* Kilometerstand */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Kilometerstand (km)
            </label>
            <Input
              placeholder="z.B. 125340"
              type="number"
              min="0"
              value={fuelKm}
              onChange={(e) => setFuelKm(e.target.value)}
            />
            {errors.fuelKm && (
              <p className="text-sm font-medium text-destructive">{errors.fuelKm}</p>
            )}
          </div>

          {/* Getankte Liter */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Getankte Liter
            </label>
            <Input
              placeholder="z.B. 45.5"
              type="number"
              step="0.1"
              min="0"
              value={fuelLiters}
              onChange={(e) => setFuelLiters(e.target.value)}
            />
            {errors.fuelLiters && (
              <p className="text-sm font-medium text-destructive">{errors.fuelLiters}</p>
            )}
          </div>

          {/* Vollbetankung */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fuelFullTank"
              checked={fuelFullTank}
              onCheckedChange={(checked) => setFuelFullTank(checked === true)}
            />
            <label
              htmlFor="fuelFullTank"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Vollbetankung (für Verbrauchsberechnung)
            </label>
          </div>
          <p className="text-xs text-gray-500">
            ℹ️ Nur bei Vollbetankung kann der Verbrauch von Tankfüllung zu Tankfüllung berechnet werden.
          </p>
        </div>
      )}

      {/* Beschreibung */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Beschreibung
        </label>
        <Textarea
          placeholder="z.B. Einkäufe bei Aldi, Diesel an der Tanke..."
          className="resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && (
          <p className="text-sm font-medium text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Aktionen */}
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>Speichern...</>
          ) : entry ? (
            'Aktualisieren'
          ) : (
            'Hinzufügen'
          )}
        </Button>
      </div>
    </form>
  );
}

export default BudgetEntryForm;
