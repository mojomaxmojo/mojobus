import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { TAG_CATEGORIES, TagOption } from '@/config/tags';
import { useState } from 'react';

interface TagDropdownProps {
  category: string;
  selectedTags: string[];
  onTagChange: (tag: string, isSelected: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function TagDropdown({
  category,
  selectedTags,
  onTagChange,
  disabled = false,
  className = ""
}: TagDropdownProps) {
  const tagCategory = TAG_CATEGORIES[category];

  if (!tagCategory) {
    console.warn(`Tag category '${category}' not found`);
    return null;
  }

  const selectedTag = tagCategory.tags.find(tag => selectedTags.includes(tag.value));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {tagCategory.label}
        </label>
        {tagCategory.description && (
          <div className="group relative">
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover border rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {tagCategory.description}
            </div>
          </div>
        )}
      </div>

      <Select
        value={selectedTag?.value || ""}
        onValueChange={(value) => {
          // Wrap in try-catch to handle any errors during the callback
          try {
            // Toggle selection: if already selected, deselect; otherwise select new one
            const isAlreadySelected = selectedTags.includes(value);

            // Deselect all tags from this category (single selection per category)
            tagCategory.tags.forEach(tag => {
              if (selectedTags.includes(tag.value)) {
                onTagChange(tag.value, false);
              }
            });

            // Select new tag if it wasn't selected before
            if (!isAlreadySelected) {
              onTagChange(value, true);
            }
          } catch (error) {
            console.error('Tag selection failed:', error);
            // Optional: show user feedback about the error
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Wähle ${tagCategory.label}...`} />
        </SelectTrigger>
        <SelectContent>
          {tagCategory.tags.map((tag: TagOption) => (
            <SelectItem key={tag.value} value={tag.value}>
              <div className="flex items-center gap-2">
                <span>{tag.label}</span>
                {selectedTags.includes(tag.value) && (
                  <Badge variant="secondary" className="ml-auto">
                    ✓
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Zeige aktuellen Status */}
      {selectedTag && (
        <div className="text-xs text-muted-foreground">
          Ausgewählt: {selectedTag.label}
        </div>
      )}
    </div>
  );
}

/**
 * Multiple-Selection Tag Dropdown (für zukünftige Erweiterung)
 */
interface MultiTagDropdownProps extends Omit<TagDropdownProps, 'onTagChange'> {
  onTagsChange: (tags: string[]) => void;
  maxSelections?: number;
}

export function MultiTagDropdown({
  category,
  selectedTags,
  onTagsChange,
  maxSelections,
  disabled = false,
  className = ""
}: MultiTagDropdownProps) {
  const tagCategory = TAG_CATEGORIES[category];

  if (!tagCategory) return null;

  const handleTagToggle = (tagValue: string, isSelected: boolean) => {
    if (isSelected) {
      if (maxSelections && selectedTags.length >= maxSelections) {
        return; // Maximum reached
      }
      onTagsChange([...selectedTags, tagValue]);
    } else {
      onTagsChange(selectedTags.filter(tag => tag !== tagValue));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {tagCategory.label} ({selectedTags.length})
          {maxSelections && ` / ${maxSelections}`}
        </label>
        {tagCategory.description && (
          <div className="group relative">
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover border rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {tagCategory.description}
            </div>
          </div>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tagCategory.tags
            .filter(tag => selectedTags.includes(tag.value))
            .map(tag => (
              <Badge
                key={tag.value}
                variant="default"
                className="cursor-pointer"
                onClick={() => handleTagToggle(tag.value, false)}
              >
                {tag.label} ×
              </Badge>
            ))
          }
        </div>
      )}

      {/* Available Tags */}
      <div className="border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">
        {tagCategory.tags
          .filter(tag => !selectedTags.includes(tag.value))
          .map(tag => (
            <div
              key={tag.value}
              className="text-sm p-1 rounded hover:bg-muted cursor-pointer"
              onClick={() => handleTagToggle(tag.value, true)}
            >
              {tag.label}
            </div>
          ))
        }
      </div>

      {maxSelections && selectedTags.length >= maxSelections && (
        <div className="text-xs text-muted-foreground">
          Maximale Auswahl erreicht ({maxSelections})
        </div>
      )}
    </div>
  );
}