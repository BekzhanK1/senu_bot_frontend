import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
  }

  const tgUserId = request.nextUrl.searchParams.get('tg_user_id');
  if (!tgUserId) {
    return NextResponse.json({ error: 'tg_user_id is required.' }, { status: 400 });
  }

  const target = new URL(`${backendApiUrl.replace(/\/$/, '')}/api/admin/schedule`);
  target.searchParams.set('tg_user_id', tgUserId);

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
  return NextResponse.json(payload ?? {});
}

export async function PUT(request: NextRequest) {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const internalToken = process.env.BACKEND_API_TOKEN;
  const response = await fetch(`${backendApiUrl.replace(/\/$/, '')}/api/admin/schedule`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...(internalToken ? { 'x-internal-token': internalToken } : {}),
    },
    body: JSON.stringify(body),
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
    return NextResponse.json(
      payload ?? { error: 'Backend request failed.' },
      { status: response.status }
    );
  }
  return NextResponse.json(payload ?? { ok: true });
}
