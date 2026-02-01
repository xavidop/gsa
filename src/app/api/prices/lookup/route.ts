/**
 * Price Lookup API Route
 * 
 * This route handles price lookups from various external APIs.
 * API keys are kept server-side for security.
 * 
 * Environment Variables Required:
 * - TCGPLAYER_API_KEY (optional)
 * - TCGPLAYER_API_SECRET (optional)
 * - EBAY_APP_ID (optional)
 * - PRICECHARTING_API_KEY (optional)
 */

import { NextRequest, NextResponse } from 'next/server';

interface PriceRequest {
  cardName: string;
  set?: string;
  year?: string;
  cardNumber?: string;
  grade?: number;
  category?: string;
}

interface PriceResponse {
  price: number | null;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: string;
  currency: string;
  priceBreakdown?: {
    low: number;
    mid: number;
    high: number;
    market: number;
  };
  error?: string;
}

// TCGplayer API integration
async function fetchFromTCGplayer(params: PriceRequest): Promise<PriceResponse | null> {
  const apiKey = process.env.TCGPLAYER_API_KEY;
  const apiSecret = process.env.TCGPLAYER_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    return null;
  }
  
  try {
    // First, get bearer token
    const tokenResponse = await fetch('https://api.tcgplayer.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
    });
    
    if (!tokenResponse.ok) {
      console.error('TCGplayer token error:', await tokenResponse.text());
      return null;
    }
    
    const { access_token } = await tokenResponse.json();
    
    // Search for the card
    const searchQuery = encodeURIComponent(`${params.cardName} ${params.set || ''}`);
    const searchResponse = await fetch(
      `https://api.tcgplayer.com/catalog/products?productName=${searchQuery}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );
    
    if (!searchResponse.ok) {
      console.error('TCGplayer search error:', await searchResponse.text());
      return null;
    }
    
    const { results } = await searchResponse.json();
    
    if (!results || results.length === 0) {
      return null;
    }
    
    // Get prices for the first matching product
    const productId = results[0].productId;
    const priceResponse = await fetch(
      `https://api.tcgplayer.com/pricing/product/${productId}`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );
    
    if (!priceResponse.ok) {
      return null;
    }
    
    const priceData = await priceResponse.json();
    const prices = priceData.results?.[0];
    
    if (!prices) {
      return null;
    }
    
    return {
      price: prices.marketPrice || prices.midPrice,
      source: 'TCGplayer',
      confidence: 'high',
      lastUpdated: new Date().toISOString(),
      currency: 'USD',
      priceBreakdown: {
        low: prices.lowPrice,
        mid: prices.midPrice,
        high: prices.highPrice,
        market: prices.marketPrice,
      },
    };
  } catch (error) {
    console.error('TCGplayer API error:', error);
    return null;
  }
}

// eBay Browse API integration
async function fetchFromEbay(params: PriceRequest): Promise<PriceResponse | null> {
  const appId = process.env.EBAY_APP_ID;
  
  if (!appId) {
    return null;
  }
  
  try {
    // Build search query
    const query = [
      params.cardName,
      params.set,
      params.year,
      params.grade ? `PSA ${params.grade}` : '',
    ].filter(Boolean).join(' ');
    
    // Search completed listings
    const searchUrl = new URL('https://api.ebay.com/buy/browse/v1/item_summary/search');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('filter', 'buyingOptions:{FIXED_PRICE|AUCTION}');
    searchUrl.searchParams.set('sort', 'price');
    searchUrl.searchParams.set('limit', '50');
    
    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${appId}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('eBay API error:', await response.text());
      return null;
    }
    
    const data = await response.json();
    const items = data.itemSummaries || [];
    
    if (items.length === 0) {
      return null;
    }
    
    // Calculate price statistics
    const prices = items
      .map((item: any) => parseFloat(item.price?.value || '0'))
      .filter((p: number) => p > 0)
      .sort((a: number, b: number) => a - b);
    
    if (prices.length === 0) {
      return null;
    }
    
    const low = prices[0];
    const high = prices[prices.length - 1];
    const mid = prices[Math.floor(prices.length / 2)];
    const market = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length;
    
    return {
      price: Math.round(market * 100) / 100,
      source: 'eBay',
      confidence: prices.length >= 10 ? 'high' : prices.length >= 3 ? 'medium' : 'low',
      lastUpdated: new Date().toISOString(),
      currency: 'USD',
      priceBreakdown: {
        low: Math.round(low * 100) / 100,
        mid: Math.round(mid * 100) / 100,
        high: Math.round(high * 100) / 100,
        market: Math.round(market * 100) / 100,
      },
    };
  } catch (error) {
    console.error('eBay API error:', error);
    return null;
  }
}

// PriceCharting API integration
async function fetchFromPriceCharting(params: PriceRequest): Promise<PriceResponse | null> {
  const apiKey = process.env.PRICECHARTING_API_KEY;
  
  if (!apiKey) {
    return null;
  }
  
  try {
    const query = encodeURIComponent(`${params.cardName} ${params.set || ''}`);
    const response = await fetch(
      `https://www.pricecharting.com/api/products?t=${apiKey}&q=${query}&type=prices`,
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      return null;
    }
    
    const product = data.products[0];
    
    return {
      price: product['cib-price'] || product['loose-price'],
      source: 'PriceCharting',
      confidence: 'medium',
      lastUpdated: new Date().toISOString(),
      currency: 'USD',
      priceBreakdown: {
        low: product['loose-price'] || 0,
        mid: product['cib-price'] || 0,
        high: product['new-price'] || 0,
        market: product['cib-price'] || product['loose-price'] || 0,
      },
    };
  } catch (error) {
    console.error('PriceCharting API error:', error);
    return null;
  }
}

// Fallback estimation when no API data available
function estimatePrice(params: PriceRequest): PriceResponse {
  const basePrice = 20; // Base price assumption
  const grade = params.grade || 7;
  
  // Grade multipliers (rough PSA market data)
  const gradeMultipliers: Record<number, number> = {
    10: 5.0,
    9: 2.0,
    8: 1.2,
    7: 1.0,
    6: 0.6,
    5: 0.4,
    4: 0.3,
    3: 0.2,
    2: 0.15,
    1: 0.1,
  };
  
  const multiplier = gradeMultipliers[Math.floor(grade)] || 1.0;
  const estimatedPrice = Math.round(basePrice * multiplier * 100) / 100;
  
  return {
    price: estimatedPrice,
    source: 'Estimation',
    confidence: 'low',
    lastUpdated: new Date().toISOString(),
    currency: 'USD',
    priceBreakdown: {
      low: Math.round(estimatedPrice * 0.7 * 100) / 100,
      mid: estimatedPrice,
      high: Math.round(estimatedPrice * 1.5 * 100) / 100,
      market: estimatedPrice,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PriceRequest = await request.json();
    
    if (!body.cardName) {
      return NextResponse.json(
        { error: 'Card name is required' },
        { status: 400 }
      );
    }
    
    // Try each price source in order of preference
    const category = body.category || 'other';
    
    let result: PriceResponse | null = null;
    
    // Route to appropriate API based on card category
    if (['pokemon', 'magic', 'yugioh'].includes(category)) {
      // TCGplayer is best for TCG cards
      result = await fetchFromTCGplayer(body);
    }
    
    if (!result && ['sports-baseball', 'sports-basketball', 'sports-football', 'sports-hockey', 'sports-soccer'].includes(category)) {
      // eBay is best for sports cards
      result = await fetchFromEbay(body);
    }
    
    // Try other sources as fallback
    if (!result) {
      result = await fetchFromTCGplayer(body);
    }
    
    if (!result) {
      result = await fetchFromEbay(body);
    }
    
    if (!result) {
      result = await fetchFromPriceCharting(body);
    }
    
    // If all APIs fail, use estimation
    if (!result) {
      result = estimatePrice(body);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Price lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Price lookup API',
    usage: 'POST with { cardName, set?, year?, grade?, category? }',
    supportedCategories: [
      'pokemon',
      'magic',
      'yugioh',
      'sports-baseball',
      'sports-basketball',
      'sports-football',
      'sports-hockey',
      'sports-soccer',
      'other',
    ],
  });
}
