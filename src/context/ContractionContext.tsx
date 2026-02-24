"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, writeBatch, Timestamp, serverTimestamp } from "firebase/firestore";
import { db, contractionsCollection } from "@/lib/firebase";
import type { Contraction, StoredContraction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ContractionContextType {
  contractions: Contraction[];
  addContraction: (contraction: StoredContraction) => Promise<void>;
  clearHistory: () => Promise<void>;
  loading: boolean;
  lastHourStats: {
    averageDuration: number;
    averageFrequency: number;
  };
}

const ContractionContext = createContext<ContractionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "contractions";

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
    const q = query(contractionsCollection, orderBy("startedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newContractions: Contraction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Contraction));
      
      setContractions(newContractions);
      
      // Sync to localStorage
      try {
        const serializableContractions = newContractions.map(c => ({
          ...c,
          startedAt: c.startedAt.toDate().toISOString(),
          endedAt: c.endedAt.toDate().toISOString(),
        }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializableContractions));
      } catch (e) {
        console.error("Failed to write to localStorage", e);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'sincronizar');
      // Fallback to localStorage
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          const parsedData = JSON.parse(localData).map((c: any) => ({
            ...c,
            startedAt: Timestamp.fromDate(new Date(c.startedAt)),
            endedAt: Timestamp.fromDate(new Date(c.endedAt)),
          }));
          setContractions(parsedData);
        }
      } catch(e) {
        console.error("Failed to read from localStorage", e);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const addContraction = useCallback(async (contraction: StoredContraction) => {
    try {
      await addDoc(contractionsCollection, contraction);
    } catch (error) {
      handleFirestoreError(error, 'guardar');
      // Manually update local state if firestore fails
      const newContraction: Contraction = {
        id: new Date().toISOString(), // temp ID
        ...contraction,
      };
      setContractions(prev => [newContraction, ...prev]);
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY) || '[]';
        const updatedLocalData = [contraction, ...JSON.parse(localData)];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLocalData));
      } catch (e) {
        console.error("Failed to write to localStorage after Firestore failure", e);
      }
    }
  }, [toast]);

  const clearHistory = useCallback(async () => {
    try {
      const snapshot = await getDocs(contractionsCollection);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'borrar historial');
      // Still clear local state
      setContractions([]);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        console.error("Failed to clear localStorage", e);
      }
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
    <ContractionContext.Provider value={{ contractions, addContraction, clearHistory, loading, lastHourStats }}>
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
