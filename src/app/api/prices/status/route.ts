/**
 * Pricing API Status Check
 * Returns whether pricing APIs are configured
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!(
    process.env.TCGPLAYER_API_KEY ||
    process.env.EBAY_APP_ID ||
    process.env.PRICECHARTING_API_KEY
  );

  return NextResponse.json({
    configured: isConfigured,
    sources: {
      tcgplayer: !!process.env.TCGPLAYER_API_KEY,
      ebay: !!process.env.EBAY_APP_ID,
      pricecharting: !!process.env.PRICECHARTING_API_KEY,
    },
  });
}
