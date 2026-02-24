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
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualContraction, setManualContraction] = useState({
    startedAt: '',
    durationSec: '',
    intervalSec: '',
  });
  const handleClearHistory = () => {
    clearHistory();
  };
  const handleOpenManualDialog = () => setShowManualDialog(true);
  const handleCloseManualDialog = () => setShowManualDialog(false);
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualContraction({ ...manualContraction, [e.target.name]: e.target.value });
  };
  const handleManualSubmit = async () => {
    try {
      await useContractions().addContraction({
        startedAt: Timestamp.fromDate(new Date(manualContraction.startedAt)),
        endedAt: Timestamp.fromDate(new Date(manualContraction.endedAt)),
        durationSec: Number(manualContraction.durationSec),
        intervalSec: manualContraction.intervalSec ? Number(manualContraction.intervalSec) : null,
      try {
        await useContractions().addContraction({
          startedAt: Timestamp.fromDate(new Date(manualContraction.startedAt)),
          durationSec: Number(manualContraction.durationSec),
          intervalSec: Number(manualContraction.intervalSec),
        });
        setManualContraction({
          startedAt: '',
          durationSec: '',
          intervalSec: '',
        });
        setShowManualDialog(false);
      } catch (error) {
        // Manejo de error
      }

      <div className="flex justify-between items-center mb-4 gap-2">
        <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={handleOpenManualDialog}>
              Cargar contracción
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cargar contracción manual</DialogTitle>
              <DialogDescription>
                Ingresa los datos de la contracción que quieras agregar.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <input
                type="datetime-local"
                name="startedAt"
                value={manualContraction.startedAt}
                onChange={handleManualChange}
                className="w-full border rounded p-2"
                placeholder="Fecha y hora de inicio"
              />
              <input
                type="number"
                name="durationSec"
                value={manualContraction.durationSec}
                onChange={handleManualChange}
                className="w-full border rounded p-2"
                placeholder="Duración (segundos)"
              />
              <input
                type="number"
                name="intervalSec"
                value={manualContraction.intervalSec}
                onChange={handleManualChange}
                className="w-full border rounded p-2"
                placeholder="Intervalo (segundos, opcional)"
              />
              <Button variant="default" onClick={handleManualSubmit}>
                Guardar
              </Button>
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
