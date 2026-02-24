'use server';
/**
 * @fileOverview This file provides a Genkit flow for analyzing pregnancy contraction patterns.
 *
 * - analyzeContractionPatterns - A function that provides a natural language summary of contraction patterns.
 * - AnalyzeContractionPatternsInput - The input type for the analyzeContractionPatterns function.
 * - AnalyzeContractionPatternsOutput - The return type for the analyzeContractionPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for the wrapper function and flow
const ContractionSchema = z.object({
  startedAt: z.number().describe('Timestamp in milliseconds when the contraction started.'),
  endedAt: z.number().describe('Timestamp in milliseconds when the contraction ended.'),
  durationSec: z.number().describe('Duration of the contraction in seconds.'),
  intervalSec: z.number().nullable().describe('Interval from the start of the previous contraction to the start of this contraction in seconds. Null if it is the first contraction.'),
});

const AnalyzeContractionPatternsInputSchema = z.object({
  contractions: z.array(ContractionSchema).describe('A list of recent contractions to analyze.'),
});
export type AnalyzeContractionPatternsInput = z.infer<typeof AnalyzeContractionPatternsInputSchema>;

// Output Schema
const AnalyzeContractionPatternsOutputSchema = z.object({
  summary: z.string().describe('A natural language summary and analysis of the contraction patterns in Spanish.'),
});
export type AnalyzeContractionPatternsOutput = z.infer<typeof AnalyzeContractionPatternsOutputSchema>;

// Wrapper function
export async function analyzeContractionPatterns(input: AnalyzeContractionPatternsInput): Promise<AnalyzeContractionPatternsOutput> {
  return analyzeContractionPatternsFlow(input);
}

// Input schema for the PROMPT itself, which will receive pre-processed data.
const AnalyzeContractionPromptInputSchema = z.object({
  jsonContractions: z.string().describe('JSON stringified array of recent contractions.'),
});

// Prompt definition
const analyzeContractionPrompt = ai.definePrompt({
  name: 'analyzeContractionPrompt',
  input: { schema: AnalyzeContractionPromptInputSchema },
  output: { schema: AnalyzeContractionPatternsOutputSchema },
  prompt: `Eres un asistente especializado en analizar patrones de contracciones de embarazo.
Tu tarea es proporcionar un resumen y análisis en lenguaje natural de los patrones de contracciones recientes, enfocado en la frecuencia, duración y regularidad, para ayudar a la usuaria a entender la progresión de su trabajo de parto.

Aquí tienes la lista de contracciones para analizar (formato JSON):
{{{jsonContractions}}}

Tu análisis debe incluir:
- La duración promedio de las contracciones.
- La frecuencia promedio (intervalo entre el inicio de las contracciones).
- Observaciones sobre la regularidad (si las contracciones son consistentemente similares en duración e intervalo o varían mucho).
- Cualquier tendencia notable (por ejemplo, si se están haciendo más largas, más frecuentes, o más intensas).
- Usa un tono tranquilizador y profesional.

El resultado debe ser únicamente el resumen en español.`,
});

// Flow definition
const analyzeContractionPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeContractionPatternsFlow',
    inputSchema: AnalyzeContractionPatternsInputSchema,
    outputSchema: AnalyzeContractionPatternsOutputSchema,
  },
  async (input) => {
    // Check if there are any contractions to analyze
    if (!input.contractions || input.contractions.length === 0) {
      return { summary: 'No se han proporcionado contracciones para analizar.' };
    }

    // Prepare input for the prompt by stringifying the contractions array
    const promptInput = {
      jsonContractions: JSON.stringify(input.contractions),
    };

    const { output } = await analyzeContractionPrompt(promptInput);
    return output!;
  }
);
