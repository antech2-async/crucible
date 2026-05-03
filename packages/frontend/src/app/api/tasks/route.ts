import { NextResponse } from 'next/server';
import { getTaskEscrowSnapshot } from '@/lib/server/taskEscrow';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getTaskEscrowSnapshot());
  } catch (error) {
    console.error('Failed to fetch tasks API:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
