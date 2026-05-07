import { NextResponse } from 'next/server';
import { getTaskEscrowSnapshot } from '@/lib/server/taskEscrow';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getTaskEscrowSnapshot();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch tasks API:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
