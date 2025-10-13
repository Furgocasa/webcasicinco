import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: 'BETA 6.1',
    commit: '7c4a71e',
    timestamp: new Date().toISOString(),
    features: {
      errorLogRealTime: true,
      conservativeClassification: true,
      openAIErrorHandling: true,
      maxPages: 3,
      citiesPerProvince: 5,
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasGoogleKey: !!process.env.GOOGLE_MAPS_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    }
  });
}

