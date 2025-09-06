import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { validateSession } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    // Only admin can clear all students
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    await executeQuery('DELETE FROM students');

    return NextResponse.json({ message: 'All students cleared successfully' });
  } catch (error) {
    console.error('Clear students error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}