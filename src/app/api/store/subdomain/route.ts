import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subdomain = searchParams.get('subdomain');

  if (!subdomain) {
    return NextResponse.json({ error: 'Missing subdomain' }, { status: 400 });
  }

  const snapshot = await adminDb
    .collection('stores')
    .where('subdomain', '==', subdomain)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return NextResponse.json({ store: null });
  }

  const doc = snapshot.docs[0];
  return NextResponse.json({ store: { id: doc.id, ...doc.data() } });
}
