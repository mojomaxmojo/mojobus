import React, { useState } from 'react';
import { AFAEntry } from '@/types/budget';
import { DEFAULT_CATEGORIES } from '@/config/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface AFAEntryFormProps {
  entry?: AFAEntry;
  onSubmit: (data: Omit<AFAEntry, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function AFAEntryForm({ entry, onSubmit, onCancel, isSubmitting }: AFAEntryFormProps) {
  const [date, setDate] = useState<Date>(entry ? new Date(entry.date * 1000) : new Date());
  const [amount, setAmount] = useState<string>(entry ? (entry.amount / 100).toFixed(2) : '');
  const [months, setMonths] = useState<string>(entry ? entry.months.toString() : '');
  const [category, setCategory] = useState<string>(entry?.category || '');
  const [description, setDescription] = useState<string>(entry?.description || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = "Bitte wähle ein Datum";
    
    if (!amount || amount.trim() === '') newErrors.amount = "Bitte gib einen Betrag ein";
    else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) newErrors.amount = "Bitte gib einen gültigen Betrag ein";

    if (!months || months.trim() === '') newErrors.months = "Bitte gib die Anzahl Monate ein";
    else if (!Number.isInteger(parseFloat(months)) || parseInt(months) <= 0) newErrors.months = "Bitte gib eine ganze Zahl größer 0 ein";

    if (!category) newErrors.category = "Bitte wähle eine Kategorie";

    if (!description || description.trim().length < 2) newErrors.description = "Beschreibung muss mindestens 2 Zeichen haben";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const amountInCent = Math.round(parseFloat(amount) * 100);
    
    onSubmit({
      date: Math.floor(date.getTime() / 1000),
      amount: amountInCent,
      months: parseInt(months),
      category,
      description: description,
    });
  };

  // Vorschau der monatlichen Rate
  const monthlyPreview = (parseFloat(amount) && parseInt(months))
    ? parseFloat(amount) / parseInt(months)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datum */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium leading-none">Datum (Kaufdatum)</label>
        <div className="relative">
          <Input
            type="date"
            value={format(date, 'yyyy-MM-dd')}
            onChange={(e) => {
              const newDate = new Date(e.target.value + 'T00:00:00');
              if (!isNaN(newDate.getTime())) setDate(newDate);
            }}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="pr-10"
          />
          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {errors.date && <p className="text-sm font-medium text-destructive">{errors.date}</p>}
      </div>

      {/* Beschreibung */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Beschreibung</label>
        <Textarea
          placeholder="z.B. Neue Küche, neuer Kühlschrank..."
          className="resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {errors.description && <p className="text-sm font-medium text-destructive">{errors.description}</p>}
      </div>

      {/* Betrag */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Gesamtbetrag (€)</label>
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
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
        </div>
        {errors.amount && <p className="text-sm font-medium text-destructive">{errors.amount}</p>}
      </div>

      {/* Monate */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Anzahl Monate</label>
        <Input
          placeholder="z.B. 60"
          type="number"
          min="1"
          step="1"
          value={months}
          onChange={(e) => setMonths(e.target.value)}
        />
        {errors.months && <p className="text-sm font-medium text-destructive">{errors.months}</p>}
      </div>

      {/* Kategorie */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Kategorie</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Kategorie wählen" />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm font-medium text-destructive">{errors.category}</p>}
      </div>

      {/* Vorschau */}
      {monthlyPreview > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Monatliche Rate</h4>
          <div className="text-2xl font-bold text-blue-700">
            {monthlyPreview.toFixed(2)} € / Monat
          </div>
          <p className="text-sm text-blue-600 mt-1">
            {parseFloat(amount).toFixed(2)} € über {months} Monate
          </p>
        </div>
      )}

      {/* Aktionen */}
      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Abbrechen
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Speichern...' : entry ? 'Aktualisieren' : 'Hinzufügen'}
        </Button>
      </div>
    </form>
  );
}

export default AFAEntryForm;
