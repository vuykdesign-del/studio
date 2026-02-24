"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatInterval } from "@/lib/utils";
import { useContractions } from "@/context/ContractionContext";

export function SummaryStats() {
  const { lastHourStats } = useContractions();

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="text-sm font-normal tracking-widest text-muted-foreground text-center">
          PROMEDIO ÚLTIMA HORA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-accent">
              {formatInterval(lastHourStats.averageFrequency)}
            </p>
            <p className="text-sm text-muted-foreground">Frecuencia</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent">
              {Math.round(lastHourStats.averageDuration)}s
            </p>
            <p className="text-sm text-muted-foreground">Duración</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
