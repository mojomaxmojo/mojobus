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
value: "fast",
label: "Fast",
description: "Schnelle Ladezeiten, minimale Latency",
},
{
value: "balanced",
label: "Balanced",
description: "Ausgewogene Performance und Zuverlässigkeit",
},
{
value: "reliable",
label: "Reliable",
description: "Maximale Zuverlässigkeit mit mehreren Relays",
},
];

export function RelaySelector() {
  const { config, updateConfig } = useAppContext();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string>(config.relayUrls.length === 1 && config.relayUrls[0] === RELAY_PRESETS.fast.relayUrls[0] ? 'fast' :
    config.relayUrls.length === 2 && config.relayUrls[0] === RELAY_PRESETS.balanced.relayUrls[0] ? 'balanced' :
    config.relayUrls.length === 3 ? 'reliable' : 'fast');

  const applyPreset = async (preset: string) => {
    const presetConfig = RELAY_PRESETS[preset as keyof typeof RELAY_PRESETS];

    if (presetConfig) {
      try {
        console.log("Applying relay preset:", preset);
        console.log("New relay configuration:", presetConfig);

        updateConfig((currentConfig) => ({
          ...currentConfig,
          relayUrls: presetConfig.relayUrls,
          activeRelay: presetConfig.relayUrls[0],
          maxRelays: presetConfig.maxRelays,
          queryTimeout: presetConfig.queryTimeout,
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
Automatische Anpassung aller Relay-Einstellungen
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
{RELAY_PRESETS[selectedPreset as keyof typeof RELAY_PRESETS]?.queryTimeout ? `${RELAY_PRESETS[selectedPreset as keyof typeof RELAY_PRESETS].queryTimeout / 1000}s` : "-"} ms
</div>
</div>
<div>
<span className="font-medium">Deduplizierung:</span>
<div className="text-muted-foreground">
Aktiv
</div>
</div>
</div>
</div>
)}
</div>
);
}
