import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
  }

  const date = request.nextUrl.searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'date is required (YYYY-MM-DD).' }, { status: 400 });
  }

  const target = new URL(`${backendApiUrl.replace(/\/$/, '')}/api/meetings/availability`);
  target.searchParams.set('date', date);

  const internalToken = process.env.BACKEND_API_TOKEN;
  const response = await fetch(target.toString(), {
    method: 'GET',
    headers: {
      ...(internalToken ? { 'x-internal-token': internalToken } : {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    return NextResponse.json(payload ?? { error: 'Backend request failed.' }, { status: response.status });
  }
  return NextResponse.json(payload ?? { slots: [] });
}
