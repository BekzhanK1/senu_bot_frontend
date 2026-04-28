import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';
const BACKEND_BASE = BACKEND_URL.replace(/\/$/, '');
const BACKEND_TOKEN = process.env.BACKEND_API_TOKEN || '';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const response = await fetch(`${BACKEND_BASE}/api/admin/menu-buttons/${params.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': BACKEND_TOKEN,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: text }, { status: response.status });
    }
  }

  return NextResponse.json(payload, { status: response.status });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.toString();

  const response = await fetch(`${BACKEND_BASE}/api/admin/menu-buttons/${params.id}?${query}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': BACKEND_TOKEN,
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: text }, { status: response.status });
    }
  }

  return NextResponse.json(payload, { status: response.status });
}
