import { NextRequest, NextResponse } from 'next/server'

// This API route is kept as a fallback/stub.
// PDF compression now happens entirely client-side for better privacy and no server dependencies.
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Client-side compression is now used. This endpoint is deprecated.' 
  }, { status: 410 })
}