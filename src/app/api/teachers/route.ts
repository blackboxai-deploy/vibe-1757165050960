import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { validateSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    const teachers = await executeQuery(
      'SELECT id, name, position, created_at FROM teachers ORDER BY created_at DESC'
    );

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ message: 'Invalid session' }, { status: 401 });
    }

    const { name, position } = await request.json();

    if (!name || !position) {
      return NextResponse.json(
        { message: 'Name and position are required' },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      'INSERT INTO teachers (name, position) VALUES (?, ?)',
      [name, position]
    );

    const newTeacher = {
      id: result.insertId,
      name,
      position,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Teacher added successfully',
      teacher: newTeacher,
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}