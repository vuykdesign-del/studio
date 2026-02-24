"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { formatTimer } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useContractions } from "@/context/ContractionContext";
import { Timestamp } from "firebase/firestore";
import { SummaryStats } from "./summary-stats";

export function Tracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const { addContraction, contractions } = useContractions();

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);
  
  const handleToggleTracking = () => {
    setIsTracking((prev) => !prev);
  };

  useEffect(() => {
    if (isTracking) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      stopTimer();
      if (startTimeRef.current) {
        const endedAt = new Date();
        const startedAt = new Date(startTimeRef.current);
        const durationSec = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
        
        if (durationSec > 0) {
            const lastContraction = contractions.length > 0 ? contractions[0] : null;
            const intervalSec = lastContraction ? Math.round((startedAt.getTime() - lastContraction.startedAt.toMillis()) / 1000) : null;
    
            addContraction({
                startedAt: Timestamp.fromDate(startedAt),
                endedAt: Timestamp.fromDate(endedAt),
                durationSec,
                intervalSec
            });
        }

        startTimeRef.current = null;
        setElapsedTime(0);
      }
    }
  }, [isTracking, addContraction, contractions, stopTimer]);

  return (
    <div className="flex flex-col h-full p-4">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold">Tracker de panza</h1>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">DURACIÓN</p>
            <p className="text-8xl font-bold text-accent font-mono my-2 tracking-tighter">
                {formatTimer(elapsedTime)}
            </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 my-8">
        <Button
            onClick={handleToggleTracking}
            className={cn(
                "rounded-full h-48 w-48 text-3xl font-bold border-4 transition-all duration-300 ease-in-out transform active:scale-95",
                isTracking
                ? "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30 animate-destructive-glow shadow-destructive/50"
                : "bg-primary/20 border-primary text-primary hover:bg-primary/30"
            )}
        >
          {isTracking ? "PARAR" : "EMPEZAR"}
        </Button>
        <p className="text-muted-foreground text-center h-10">
          {isTracking
            ? "Pulsa el botón cuando termine la contracción."
            : "Pulsa el botón cuando empiece una contracción."}
        </p>
      </div>
      
      <div className="mt-auto">
        <SummaryStats />
      </div>
    </div>
  );
}
