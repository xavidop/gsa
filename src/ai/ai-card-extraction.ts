'use server';
/**
 * @fileOverview AI service for extracting trading card information from images using Gemini
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractCardInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of the trading card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type ExtractCardInput = z.infer<typeof ExtractCardInputSchema>;

const ExtractCardOutputSchema = z.object({
  cardName: z
    .string()
    .describe('The name of the card, usually the character or Pokemon name.'),
  set: z
    .string()
    .optional()
    .describe('The set or series name the card belongs to (e.g., "Base Set", "Jungle", "Team Rocket").'),
  year: z
    .string()
    .optional()
    .describe('The year the card was released.'),
  cardNumber: z
    .string()
    .optional()
    .describe('The card number within the set (e.g., "4/102", "25").'),
  variant: z
    .string()
    .optional()
    .describe('Any variant information (e.g., "Holo", "First Edition", "Shadowless", "Reverse Holo").'),
  rarity: z
    .string()
    .optional()
    .describe('The rarity of the card (e.g., "Common", "Uncommon", "Rare", "Holo Rare", "Ultra Rare").'),
  cardType: z
    .string()
    .optional()
    .describe('The type of card (e.g., "Pokemon", "Sports", "Yu-Gi-Oh", "Magic: The Gathering").'),
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score for the extraction (0-1), based on image quality and clarity of information.'),
});

export type ExtractCardOutput = z.infer<typeof ExtractCardOutputSchema>;

export async function extractCardInfo(input: ExtractCardInput): Promise<ExtractCardOutput> {
  return extractCardInfoFlow(input);
}

const extractCardPrompt = ai.definePrompt({
  name: 'extractCardPrompt',
  input: { schema: ExtractCardInputSchema },
  output: { schema: ExtractCardOutputSchema },
  prompt: `You are an expert at identifying trading cards from images. Analyze this trading card image and extract all visible information.

Image: {{media url=imageDataUri}}

Instructions:
1. Identify the card name (usually the character, Pokemon, or player name)
2. Identify the set name if visible (e.g., "Base Set", "Jungle", "Topps", etc.)
3. Find the card number if present (usually in format like "4/102" or just "25")
4. Note any variants (Holo, First Edition, Shadowless, Reverse Holo, etc.)
5. Determine the rarity if visible (symbols or text indicating Common, Uncommon, Rare, etc.)
6. Identify the card type/game (Pokemon, Yu-Gi-Oh, Magic, Sports card, etc.)
7. Extract the year if visible
8. Provide a confidence score based on how clearly you can see and read the information

Be as accurate as possible. If information is not clearly visible, leave those fields empty. Focus on what you can confidently extract from the image.`,
});

/**
 * Extracts trading card information from an image using Gemini AI
 */
const extractCardInfoFlow = ai.defineFlow(
  {
    name: 'extractCardInfoFlow',
    inputSchema: ExtractCardInputSchema,
    outputSchema: ExtractCardOutputSchema,
  },
  async (input) => {
    const { output } = await extractCardPrompt(input);
    return output!;
  }
);
