import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ACTIONS = new Set(['block', 'unblock']);

export async function POST(
  request: NextRequest,
  context: { params: { id: string; action: string } }
) {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
  }

  const { id, action } = context.params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const internalToken = process.env.BACKEND_API_TOKEN;
  const response = await fetch(`${backendApiUrl.replace(/\/$/, '')}/api/admin/users/${id}/${action}`, {
    method: 'POST',
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
    return NextResponse.json(payload ?? { error: 'Backend request failed.' }, { status: response.status });
  }
  return NextResponse.json(payload ?? { ok: true });
}
