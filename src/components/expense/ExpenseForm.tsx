/**
 * Expense Form Component
 * Form for creating new encrypted expense entries
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

import {
  EXPENSE_CATEGORIES,
  formatAmount,
  getCurrentMonth,
} from '@/config/expenseTypes';
import { createExpenseEvent } from '@/lib/expenseEncryption';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

interface ExpenseFormProps {
  currentUserPubkey: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpenseForm({ currentUserPubkey, onClose, onSuccess }: ExpenseFormProps) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  
  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('transport');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize with current date
  useEffect(() => {
    setDate(new Date());
  }, []);
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Amount validation
    if (!amount.trim()) {
      newErrors.amount = 'Betrag ist erforderlich';
    } else {
      const amountNum = parseFloat(amount.replace(',', '.'));
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Bitte gültigen Betrag eingeben';
      }
    }
    
    // Category validation
    if (!category) {
      newErrors.category = 'Kategorie ist erforderlich';
    }
    
    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
    } else if (description.length > 500) {
      newErrors.description = 'Beschreibung darf maximal 500 Zeichen haben';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Fehler im Formular',
        description: 'Bitte überprüfe die Eingaben.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user?.signer) {
      toast({
        title: 'Nicht eingeloggt',
        description: 'Bitte mit Nostr einloggen.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare expense data
      const amountNum = parseFloat(amount.replace(',', '.'));
      const expenseData = {
        amount: amountNum,
        category,
        description: description.trim(),
        date: format(date, 'yyyy-MM-dd'),
        location: location.trim() || undefined,
        tags: [...tags],
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      };
      
      // Create and publish event
      // For NIP-07, the extension handles signing through user.signer
      const event = await createExpenseEvent(
        expenseData,
        user.signer,
        currentUserPubkey
      );
      
      await publishEvent(event);
      
      toast({
        title: 'Ausgabe gespeichert',
        description: 'Die Ausgabe wurde verschlüsselt gespeichert.',
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: 'Die Ausgabe konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle adding a custom tag
  const handleAddTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle key press for tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Get category emoji and color
  const selectedCategory = EXPENSE_CATEGORIES.find(cat => cat.id === category);
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Neue Ausgabe</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">
            Betrag (EUR) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="42,50"
              className={cn(
                'text-lg font-medium pl-8',
                errors.amount && 'border-destructive'
              )}
              disabled={isSubmitting}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              €
            </div>
          </div>
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount}</p>
          )}
          {amount && !errors.amount && (
            <p className="text-sm text-muted-foreground">
              {formatAmount(parseFloat(amount.replace(',', '.')))}
            </p>
          )}
        </div>
        
        {/* Category Select */}
        <div className="space-y-2">
          <Label htmlFor="category">
            Kategorie <span className="text-destructive">*</span>
          </Label>
          <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
            <SelectTrigger className={cn(errors.category && 'border-destructive')}>
              <SelectValue>
                {selectedCategory && (
                  <div className="flex items-center gap-2">
                    <span>{selectedCategory.emoji}</span>
                    <span>{selectedCategory.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                    {cat.description && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {cat.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category}</p>
          )}
          {selectedCategory?.description && (
            <p className="text-sm text-muted-foreground">
              {selectedCategory.description}
            </p>
          )}
        </div>
        
        {/* Description Input */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Beschreibung <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Was wurde gekauft/getan? (z.B. 'Diesel tanken', 'Supermarkt Einkauf')"
            className={cn(errors.description && 'border-destructive')}
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
          <div className="text-xs text-muted-foreground text-right">
            {description.length}/500 Zeichen
          </div>
        </div>
        
        {/* Date Picker */}
        <div className="space-y-2">
          <Label>Datum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, 'PPP', { locale: de })
                ) : (
                  <span>Datum auswählen</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                locale={de}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Location Input */}
        <div className="space-y-2">
          <Label htmlFor="location">Ort (optional)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="z.B. 'Köln', 'Shell Tankstelle'"
            disabled={isSubmitting}
          />
          <p className="text-sm text-muted-foreground">
            Nur Text, keine GPS-Daten
          </p>
        </div>
        
        {/* Tags Input */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="z.B. 'diesel', 'shell', 'supermarkt'"
              disabled={isSubmitting}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={isSubmitting || !customTag.trim()}
            >
              Hinzufügen
            </Button>
          </div>
          
          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Tags helfen bei der Kategorisierung und Suche
          </p>
        </div>
        
        {/* Security Note */}
        <div className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs">🔒</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Sicherheit</p>
              <p className="text-sm text-muted-foreground mt-1">
                Diese Ausgabe wird end-to-end verschlüsselt und ist nur für Mojo und Susanne lesbar.
                Öffentlich sind nur Monat, Hauptkategorie und Betragsbereich sichtbar.
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              'Verschlüsselt speichern'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}