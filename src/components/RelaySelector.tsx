import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RELAY_PRESETS } from "@/config/relays";
import { useAppContext } from "@/hooks/useAppContext";
import { useToast } from "@/hooks/useToast";

interface PresetOption {
  value: string;
  label: string;
  description: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    value: "mittel",
    label: "Mittel",
    description: "2 schnelle Relays für gute Performance",
  },
  {
    value: "gross",
    label: "Groß",
    description: "3 schnelle Relays + 1 mittelmäßiger für Balance",
  },
  {
    value: "voll",
    label: "Voll",
    description: "Alle verfügbaren Relays (7 Stück)",
  },
];

export function RelaySelector() {
  const { config, updateConfig } = useAppContext();
  const { toast } = useToast();

  // Detect current preset from read configuration
  const [selectedPreset, setSelectedPreset] = useState<string>(
    config.read?.relayUrls?.[0] === RELAY_PRESETS.mittel.relayUrls[0] ? 'mittel' :
    config.read?.relayUrls?.[0] === RELAY_PRESETS.gross.relayUrls[0] ? 'gross' :
    config.read?.relayUrls?.[0] === RELAY_PRESETS.voll.relayUrls[0] ? 'voll' :
    'mittel' // Default
  );

  const applyPreset = async (preset: string) => {
    const presetConfig = RELAY_PRESETS[preset as keyof typeof RELAY_PRESETS];

    if (presetConfig) {
      try {
        console.log("Applying relay preset:", preset);
        console.log("New relay configuration:", presetConfig);

        // Apply preset to both READ and WRITE configuration
        const readRelayUrls = presetConfig.relayUrls || [];
        const readMaxRelays = presetConfig.maxRelays || 1;
        const readQueryTimeout = presetConfig.queryTimeout || 2000;
        const writeRelayUrls = presetConfig.relayUrls || [];
        const writeMaxRelays = presetConfig.maxRelays || 1;
        const writeActiveRelay = presetConfig.relayUrls?.[0] || '';

        updateConfig((currentConfig) => ({
          ...currentConfig,
          read: {
            relayUrls: readRelayUrls,
            maxRelays: readMaxRelays,
            queryTimeout: readQueryTimeout,
          },
          write: {
            relayUrls: writeRelayUrls,
            maxRelays: writeMaxRelays,
            activeRelay: writeActiveRelay,
          },
          // Update legacy fields for backward compatibility
          relayUrls: presetConfig.relayUrls || [],
          activeRelay: presetConfig.relayUrls?.[0] || '',
          maxRelays: presetConfig.maxRelays || 1,
          queryTimeout: presetConfig.queryTimeout || 2000,
        }));

        setSelectedPreset(preset);
        toast({
          title: 'Relay-Preset angewendet',
          description: `${presetConfig.name} wurde aktiviert.`,
        });
      } catch (error) {
        console.error("Failed to apply preset:", error);
        toast({
          title: 'Fehler',
          description: 'Konnte Relay-Preset nicht anwenden.',
          variant: 'destructive',
        });
      }
    }
  };

        setSelectedPreset(preset);
        toast({
          title: 'Relay-Preset angewendet',
          description: `${presetConfig.name} wurde aktiviert.`,
        });
      } catch (error) {
        console.error("Failed to apply preset:", error);
        toast({
          title: 'Fehler',
          description: 'Konnte Relay-Preset nicht anwenden.',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    applyPreset(preset);
  };

return (
<div className="space-y-6">
<div>
<h3 className="text-lg font-semibold mb-4">Relay-Preset wählen</h3>
<p className="text-sm text-muted-foreground mb-6">
Wähle einen Relay-Preset für optimale Performance
</p>
</div>

<div>
<Label htmlFor="relay-preset">Relay-Preset wählen</Label>
<Select value={selectedPreset} onValueChange={handlePresetChange}>
<SelectTrigger id="relay-preset">
<SelectValue placeholder="Preset wählen..." />
</SelectTrigger>
<SelectContent>
{PRESET_OPTIONS.map((option) => (
<SelectItem key={option.value} value={option.value}>
<div className="flex flex-col">
<span className="font-medium">{option.label}</span>
<span className="text-xs text-muted-foreground">
{option.description}
</span>
</div>
</SelectItem>
))}
</SelectContent>
</Select>
</div>
  <p className="text-xs text-muted-foreground">
    4 Presets für verschiedene Einsatzszenarien
  </p>

  {selectedPreset && (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium mb-2">Gewähltes Preset: {selectedPreset}</h4>
      <div className="text-xs text-muted-foreground">
        {PRESET_OPTIONS.find(o => o.value === selectedPreset)?.description}
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="font-medium">Relays:</span>
          <div className="text-muted-foreground">
            {RELAY_PRESETS[selectedPreset as keyof typeof RELAY_PRESETS]?.relayUrls.join(", ") || "-"}
          </div>
        </div>
        <div>
          <span className="font-medium">Max Relays:</span>
          <div className="text-muted-foreground">
            {RELAY_PRESETS[selectedPreset as keyof typeof RELAY_PRESETS]?.maxRelays || "-"}
          </div>
        </div>
        <div>
          <span className="font-medium">Timeout:</span>
          <div className="text-muted-foreground">
            {RELAY_PRESETS[selectedPreset as keyof typeof RELAY_PRESETS]?.queryTimeout ? `${RELAY_PRESETS[selectedPreset as keyof typeof RELAY_PRESETS].queryTimeout / 1000}s` : "-"}
          </div>
        </div>
        <div>
          <span className="font-medium">Deduplizierung:</span>
          <div className="text-muted-foreground">
            {config.enableDeduplication ? "Aktiv" : "Inaktiv"}
          </div>
        </div>
      </div>
    </div>
  )}
</div>
);
}
