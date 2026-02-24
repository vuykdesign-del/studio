"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
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
    supabase
      .from('contracciones')
      .select('*')
      .order('started_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast({
            variant: "destructive",
            title: "Error de conexión",
            description: "No se pudo cargar el historial desde Supabase.",
          });
          setContractions([]);
        } else {
          const newContractions: Contraction[] = (data || []).map((row: any) => ({
            id: row.id,
            startedAt: new Date(row.started_at),
            endedAt: row.started_at ? new Date(row.started_at) : null,
            durationSec: row.duration_sec,
            intervalSec: row.interval_sec ?? null,
          }));
          setContractions(newContractions);
        }
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const addContraction = useCallback(async (contraction: StoredContraction) => {
    try {
      const { error } = await supabase.from('contracciones').insert([
        {
          id: uuidv4(),
          started_at: contraction.startedAt.toISOString(),
          duration_sec: contraction.durationSec,
          interval_sec: contraction.intervalSec ?? null,
        }
      ]);
      if (error) throw error;
      // Refresca historial
      const { data, error: fetchError } = await supabase
        .from('contracciones')
        .select('*')
        .order('started_at', { ascending: false });
      if (fetchError) throw fetchError;
      const newContractions: Contraction[] = (data || []).map((row: any) => ({
        id: row.id,
        startedAt: new Date(row.started_at),
        endedAt: row.started_at ? new Date(row.started_at) : null,
        durationSec: row.duration_sec,
        intervalSec: row.interval_sec ?? null,
      }));
      setContractions(newContractions);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo guardar la contracción en Supabase.",
      });
    }
  }, [toast]);

  const clearHistory = useCallback(async () => {
    try {
      const { error } = await supabase.from('contracciones').delete().neq('id', '');
      if (error) throw error;
      setContractions([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al borrar",
        description: "No se pudo borrar el historial en Supabase.",
      });
    }
  }, [toast]);

  const deleteContraction = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('contracciones').delete().eq('id', id);
      if (error) throw error;
      setContractions(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al borrar",
        description: "No se pudo borrar la contracción en Supabase.",
      });
    }
  }, [toast]);

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
