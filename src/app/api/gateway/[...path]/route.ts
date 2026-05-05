import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return handleGatewayRequest(request, context.params.path, 'POST');
}

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  return handleGatewayRequest(request, context.params.path, 'GET');
}

async function handleGatewayRequest(
  request: NextRequest,
  pathArray: string[],
  method: string
) {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ error: 'BACKEND_API_URL is not configured.' }, { status: 500 });
  }

  const endpoint = pathArray.join('/');
  const internalToken = process.env.BACKEND_API_TOKEN;

  let bodyText: string | undefined = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    bodyText = await request.text();
  }

  const response = await fetch(`${backendApiUrl.replace(/\/$/, '')}/api/${endpoint}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(internalToken ? { 'x-internal-token': internalToken } : {}),
    },
    body: bodyText,
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
