"use client";

import { useContractions } from "@/context/ContractionContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { SummaryStats } from "./summary-stats";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatInterval } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeContractionPatterns } from "@/ai/flows/analyze-contraction-patterns";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export function HistoryList() {
  const { contractions, clearHistory, loading } = useContractions();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleClearHistory = () => {
    clearHistory();
  };

  const handleAnalyzePatterns = async () => {
    setIsAnalyzing(true);
    setAiSummary(null);
    const plainContractions = contractions.map(c => ({
      startedAt: c.startedAt.toMillis(),
      endedAt: c.endedAt.toMillis(),
      durationSec: c.durationSec,
      intervalSec: c.intervalSec,
    }));
    try {
      const result = await analyzeContractionPatterns({ contractions: plainContractions });
      setAiSummary(result.summary);
    } catch (error) {
      console.error("AI analysis failed", error);
      setAiSummary("Hubo un error al analizar los patrones. Por favor, inténtalo de nuevo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <header className="text-center mb-4">
        <h1 className="text-2xl font-bold">Historial</h1>
      </header>

      <div className="mb-4">
        <SummaryStats />
      </div>

      <div className="flex justify-between items-center mb-4 gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={handleAnalyzePatterns} disabled={isAnalyzing || contractions.length < 2}>
              {isAnalyzing ? "Analizando..." : "Analizar con IA"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Análisis de Patrones</DialogTitle>
              <DialogDescription>
                Este es un resumen de tus contracciones generado por IA. Recuerda que no reemplaza el consejo médico.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {isAnalyzing && <Skeleton className="h-24 w-full" />}
              {aiSummary && <p className="text-sm whitespace-pre-wrap">{aiSummary}</p>}
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={contractions.length === 0}>Borrar historial</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás segura?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se borrarán permanentemente todas las contracciones registradas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground">
                Borrar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border">
        {loading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : contractions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-muted-foreground">Aún no hay contracciones registradas.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-1/3">HACE</TableHead>
                <TableHead className="text-center">DURACIÓN</TableHead>
                <TableHead className="text-right">INTERVALO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractions.map((c, index) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {formatDistanceToNow(c.startedAt.toDate(), { addSuffix: true, locale: es })}
                  </TableCell>
                  <TableCell className="text-center font-bold text-accent">{c.durationSec}s</TableCell>
                  <TableCell className="text-right font-bold text-accent">{formatInterval(c.intervalSec)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
