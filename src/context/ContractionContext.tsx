"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { appendContraction, getContractions } from "@/lib/googleSheets";
import { Timestamp } from "firebase/firestore";
import type { Contraction, StoredContraction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ContractionContextType {
  contractions: Contraction[];
  addContraction: (contraction: StoredContraction) => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteContraction: (id: string) => Promise<void>;
  loading: boolean;
  lastHourStats: {
    averageDuration: number;
    averageFrequency: number;
  };
}

const ContractionContext = createContext<ContractionContextType | undefined>(undefined);

// Eliminado: LOCAL_STORAGE_KEY

export function ContractionProvider({ children }: { children: ReactNode }) {
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleFirestoreError = (error: any, operation: string) => {
    console.error(`Firestore error during ${operation}:`, error);
    toast({
      variant: "destructive",
      title: "Error de conexión",
      description: `No se pudo ${operation} los datos. Usando almacenamiento local.`,
    });
  };

  useEffect(() => {
    setLoading(true);
    getContractions()
      .then((rows) => {
        // Asume que cada fila es [startedAt, endedAt, durationSec, intervalSec]
        const newContractions: Contraction[] = rows.slice(1).map((row: any[], idx: number) => ({
          id: String(idx),
          startedAt: Timestamp.fromDate(new Date(row[0])),
          endedAt: Timestamp.fromDate(new Date(row[1])),
          durationSec: Number(row[2]),
          intervalSec: row[3] !== undefined && row[3] !== null && row[3] !== '' ? Number(row[3]) : null,
        }));
        setContractions(newContractions);
      })
      .catch((e) => {
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "No se pudo cargar el historial desde Google Sheets.",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const addContraction = useCallback(async (contraction: StoredContraction) => {
    try {
      await appendContraction([
        contraction.startedAt.toDate().toISOString(),
        contraction.endedAt.toDate().toISOString(),
        contraction.durationSec,
        contraction.intervalSec ?? '',
      ]);
      // Refresca historial
      getContractions()
        .then((rows) => {
          const newContractions: Contraction[] = rows.slice(1).map((row: any[], idx: number) => ({
            id: String(idx),
            startedAt: Timestamp.fromDate(new Date(row[0])),
            endedAt: Timestamp.fromDate(new Date(row[1])),
            durationSec: Number(row[2]),
            intervalSec: row[3] !== undefined && row[3] !== null && row[3] !== '' ? Number(row[3]) : null,
          }));
          setContractions(newContractions);
        });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo guardar la contracción en Google Sheets.",
      });
    }
  }, [toast]);

  const clearHistory = useCallback(async () => {
    toast({
      variant: "destructive",
      title: "No implementado",
      description: "Borrar historial no está disponible en Google Sheets.",
    });
    setContractions([]);
  }, [toast]);

  const deleteContraction = useCallback(async (id: string) => {
    try {
      setContractions(prev => prev.filter(c => c.id !== id));
      // Elimina en Google Sheets: recarga todo menos la fila
      const rows = await getContractions();
      const idx = contractions.findIndex(c => c.id === id);
      if (idx >= 0) {
        const newRows = rows.filter((_, i) => i !== idx + 1); // +1 por encabezado
        // Aquí deberías implementar una función setAllContractions(newRows)
        // Por ahora solo actualiza localmente
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al borrar",
        description: "No se pudo borrar la contracción en Google Sheets.",
      });
    }
  }, [contractions, toast]);

  const lastHourStats = React.useMemo(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentContractions = contractions.filter(c => c.startedAt.toMillis() > oneHourAgo);

    if (recentContractions.length < 2) {
      const averageDuration = recentContractions.length === 1 ? recentContractions[0].durationSec : 0;
      return { averageDuration, averageFrequency: 0 };
    }

    const totalDuration = recentContractions.reduce((sum, c) => sum + c.durationSec, 0);
    const validIntervals = recentContractions.map(c => c.intervalSec).filter(i => i !== null) as number[];
    const totalInterval = validIntervals.reduce((sum, i) => sum + i, 0);
    
    return {
      averageDuration: totalDuration / recentContractions.length,
      averageFrequency: validIntervals.length > 0 ? totalInterval / validIntervals.length : 0,
    };
  }, [contractions]);

  return (
    <ContractionContext.Provider value={{ contractions, addContraction, clearHistory, deleteContraction, loading, lastHourStats }}>
      {children}
    </ContractionContext.Provider>
  );
}

export function useContractions() {
  const context = useContext(ContractionContext);
  if (context === undefined) {
    throw new Error("useContractions must be used within a ContractionProvider");
  }
  return context;
}
