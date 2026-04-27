import { NextResponse } from 'next/server';

export async function GET() {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
  }

  const internalToken = process.env.BACKEND_API_TOKEN;
  const response = await fetch(`${backendApiUrl.replace(/\/$/, '')}/api/settings/public`, {
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
  return NextResponse.json(payload ?? {});
}
