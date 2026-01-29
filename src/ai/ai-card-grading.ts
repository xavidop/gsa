'use server';
/**
 * @fileOverview An AI agent for grading trading cards based on uploaded images.
 *
 * - analyzeCard - A function that analyzes card images and returns a grading result.
 * - AnalyzeCardInput - The input type for the analyzeCard function.
 * - AnalyzeCardOutput - The return type for the analyzeCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCardInputSchema = z.object({
  frontImageDataUri: z
    .string()
    .describe(
      "A photo of the front of the card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  backImageDataUri: z
    .string()
    .describe(
      "A photo of the back of the card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeCardInput = z.infer<typeof AnalyzeCardInputSchema>;

const AnalyzeCardOutputSchema = z.object({
  overallGrade: z
    .number()
    .min(1)
    .max(10)
    .describe('The overall grade of the card, from 1 to 10 (PSA-style).'),
  subgrades: z.object({
    centering: z
      .number()
      .min(1)
      .max(10)
      .describe('The centering subgrade of the card, from 1 to 10.'),
    corners: z
      .number()
      .min(1)
      .max(10)
      .describe('The corners subgrade of the card, from 1 to 10.'),
    edges: z
      .number()
      .min(1)
      .max(10)
      .describe('The edges subgrade of the card, from 1 to 10.'),
    surface: z
      .number()
      .min(1)
      .max(10)
      .describe('The surface subgrade of the card, from 1 to 10.'),
  }),
  cardName: z.string().optional().describe('The name of the card, if detected.'),
  set: z.string().optional().describe('The set of the card, if detected.'),
  year: z.string().optional().describe('The year of the card, if detected.'),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence score of the grading, from 0 to 1.'),
});
export type AnalyzeCardOutput = z.infer<typeof AnalyzeCardOutputSchema>;

export async function analyzeCard(input: AnalyzeCardInput): Promise<AnalyzeCardOutput> {
  return analyzeCardFlow(input);
}

const analyzeCardPrompt = ai.definePrompt({
  name: 'analyzeCardPrompt',
  input: {schema: AnalyzeCardInputSchema},
  output: {schema: AnalyzeCardOutputSchema},
  prompt: `You are an expert trading card grader, providing grades and subgrades based on images of the card.\n\nAnalyze the provided images of the front and back of the card to determine its overall grade and subgrades for centering, corners, edges, and surface.\n\nFront Image: {{media url=frontImageDataUri}}\nBack Image: {{media url=backImageDataUri}}\n\nProvide the overall grade as a number between 1 and 10 (PSA-style). Provide subgrades for centering, corners, edges, and surface, also as numbers between 1 and 10.  If possible, identify the card name, set, and year.\n\nInclude a confidence score between 0 and 1 to represent the certainty of your grading.`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const analyzeCardFlow = ai.defineFlow(
  {
    name: 'analyzeCardFlow',
    inputSchema: AnalyzeCardInputSchema,
    outputSchema: AnalyzeCardOutputSchema,
  },
  async input => {
    const {output} = await analyzeCardPrompt(input);
    return output!;
  }
);
