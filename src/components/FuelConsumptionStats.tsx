import React, { useMemo } from 'react';
import { BudgetEntry } from '@/types/budget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBudget } from '@/hooks/useBudget';
import { Gauge, TrendingDown, TrendingUp, Minus, Droplets } from 'lucide-react';

interface FuelConsumptionStatsProps {
  allEntries?: BudgetEntry[];
}

interface FuelConsumptionRecord {
  date: number;
  km: number;
  totalLiters: number;
  totalPrice: number;
  consumption: number; // l/100km
  distance: number; // gefahrene km
  tankCount: number; // Anzahl Tankungen in dieser Periode
}

export function FuelConsumptionStats({ allEntries }: FuelConsumptionStatsProps) {
  const { formatAmount } = useBudget();

  // Berechne Verbrauch: Alle Tankungen von Vollbetankung zu Vollbetankung addieren
  const consumptionRecords = useMemo(() => {
    if (!allEntries) return [];

    // Filtere Diesel-Einträge, sortiert nach Datum (älteste zuerst)
    const dieselEntries = allEntries
      .filter(e => e.category === 'diesel' && e.fuelKm && e.fuelLiters && !e.deleted)
      .sort((a, b) => a.date - b.date);

    if (dieselEntries.length < 2) return [];

    const records: FuelConsumptionRecord[] = [];
    let periodStartIndex = -1; // Index der letzten Vollbetankung

    for (let i = 0; i < dieselEntries.length; i++) {
      const entry = dieselEntries[i];
      
      if (entry.fuelFullTank) {
        if (periodStartIndex >= 0) {
          // Periode abschließen: von periodStartIndex bis i (inklusive)
          const startEntry = dieselEntries[periodStartIndex];
          const endEntry = entry;
          
          const distance = endEntry.fuelKm! - startEntry.fuelKm!;
          
          // Alle Liter von Start (exklusive) bis Ende (inklusive) addieren
          let totalLiters = 0;
          let totalPrice = 0;
          let tankCount = 0;
          
          for (let j = periodStartIndex + 1; j <= i; j++) {
            const tankEntry = dieselEntries[j];
            totalLiters += tankEntry.fuelLiters!;
            totalPrice += Math.abs(tankEntry.amount);
            tankCount++;
          }
          
          if (distance > 0 && totalLiters > 0) {
            const consumption = (totalLiters / distance) * 100; // l/100km
            
            records.push({
              date: endEntry.date,
              km: endEntry.fuelKm!,
              totalLiters: Math.round(totalLiters * 100) / 100,
              totalPrice,
              consumption: Math.round(consumption * 100) / 100,
              distance,
              tankCount,
            });
          }
        }
        // Neue Periode starten
        periodStartIndex = i;
      }
    }

    return records.reverse(); // Neueste zuerst
  }, [allEntries]);

  // Durchschnittsverbrauch
  const avgConsumption = useMemo(() => {
    if (consumptionRecords.length === 0) return null;
    const sum = consumptionRecords.reduce((acc, r) => acc + r.consumption, 0);
    return Math.round((sum / consumptionRecords.length) * 100) / 100;
  }, [consumptionRecords]);

  // Verbrauchstrend
  const consumptionTrend = useMemo(() => {
    if (consumptionRecords.length < 2) return 'neutral';
    const recent = consumptionRecords[0].consumption;
    const previous = consumptionRecords[1].consumption;
    
    if (previous > recent + 0.3) return 'down';
    if (previous < recent - 0.3) return 'up';
    return 'neutral';
  }, [consumptionRecords]);

  // Max-Verbrauch für Diagramm-Skalierung
  const maxConsumption = useMemo(() => {
    if (consumptionRecords.length === 0) return 10;
    return Math.max(...consumptionRecords.map(r => r.consumption), 5);
  }, [consumptionRecords]);

  if (consumptionRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gauge className="h-5 w-5 mr-2" />
            Kraftstoffverbrauch
          </CardTitle>
          <CardDescription>
            Verbrauch pro 100km (Vollbetankung zu Vollbetankung)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Gauge className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Noch nicht genug Daten für Verbrauchsberechnung.</p>
            <p className="text-sm mt-2">Mindestens 2 Vollbetankungen erforderlich.</p>
            <p className="text-xs mt-4 text-gray-400">
              💡 Tipp: Teilbetankungen zwischen zwei Vollbetankungen werden automatisch mitberechnet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gauge className="h-5 w-5 mr-2" />
          Kraftstoffverbrauch
        </CardTitle>
        <CardDescription>
          Verbrauch pro 100km (inkl. aller Teilbetankungen)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Durchschnittsanzeige */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Durchschnittsverbrauch</p>
              <p className="text-3xl font-bold text-gray-900">
                {avgConsumption?.toFixed(1)} <span className="text-lg">l/100km</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {consumptionTrend === 'down' && (
                <div className="flex items-center text-green-600">
                  <TrendingDown className="h-6 w-6" />
                  <span className="text-sm ml-1">sinkend</span>
                </div>
              )}
              {consumptionTrend === 'up' && (
                <div className="flex items-center text-red-600">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm ml-1">steigend</span>
                </div>
              )}
              {consumptionTrend === 'neutral' && (
                <div className="flex items-center text-gray-500">
                  <Minus className="h-6 w-6" />
                  <span className="text-sm ml-1">stabil</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vertikales Säulendiagramm */}
        <div className="relative h-48 flex items-end justify-between gap-2 pt-4 mb-4">
          {consumptionRecords.slice(0, 10).map((record, index) => {
            const percentage = (record.consumption / maxConsumption) * 100;
            const date = new Date(record.date * 1000);
            const dateStr = `${date.getDate()}.${date.getMonth() + 1}.`;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center h-full justify-end">
                {/* Verbrauch über dem Balken */}
                <div className="text-xs font-bold text-gray-700 mb-1">
                  {record.consumption.toFixed(1)}
                </div>
                
                {/* Der Balken */}
                <div 
                  className="w-full rounded-t transition-all duration-300 min-h-[4px] bg-gradient-to-t from-blue-600 to-blue-400"
                  style={{ height: `${Math.max(percentage, 5)}%` }}
                  title={`${dateStr}: ${record.consumption.toFixed(1)} l/100km, ${record.distance} km, ${record.tankCount} Tankungen`}
                />
                
                {/* Datum */}
                <div className="text-xs mt-2 text-center text-gray-500">
                  {dateStr}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legende */}
        <div className="text-xs text-gray-500 text-center">
          l/100km pro Periode (Vollbetankung zu Vollbetankung)
        </div>

        {/* Detail-Tabelle */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Datum</th>
                <th className="text-right py-2 px-2">km</th>
                <th className="text-right py-2 px-2">Distanz</th>
                <th className="text-right py-2 px-2">Tankungen</th>
                <th className="text-right py-2 px-2">Liter gesamt</th>
                <th className="text-right py-2 px-2">Verbrauch</th>
                <th className="text-right py-2 px-2">Kosten</th>
              </tr>
            </thead>
            <tbody>
              {consumptionRecords.slice(0, 5).map((record, index) => {
                const date = new Date(record.date * 1000);
                return (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-2">
                      {date.toLocaleDateString('de-DE')}
                    </td>
                    <td className="text-right py-2 px-2">
                      {record.km.toLocaleString('de-DE')}
                    </td>
                    <td className="text-right py-2 px-2">
                      {record.distance.toLocaleString('de-DE')} km
                    </td>
                    <td className="text-right py-2 px-2">
                      <span className="flex items-center justify-end gap-1">
                        <Droplets className="h-3 w-3" />
                        {record.tankCount}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2">
                      {record.totalLiters.toFixed(1)} l
                    </td>
                    <td className="text-right py-2 px-2 font-medium text-blue-600">
                      {record.consumption.toFixed(1)} l/100km
                    </td>
                    <td className="text-right py-2 px-2">
                      {formatAmount(record.totalPrice, 'EUR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default FuelConsumptionStats;
