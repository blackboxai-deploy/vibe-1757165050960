import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { validateSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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

    const students = await executeQuery(
      'SELECT id, name, strand, qr_code, created_at FROM students ORDER BY created_at DESC'
    );

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
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

    const { name, strand } = await request.json();

    if (!name || !strand) {
      return NextResponse.json(
        { message: 'Name and strand are required' },
        { status: 400 }
      );
    }

    // Generate unique QR code
    const qrCode = `STU-${uuidv4().substring(0, 8).toUpperCase()}`;

    const result = await executeQuery(
      'INSERT INTO students (name, strand, qr_code) VALUES (?, ?, ?)',
      [name, strand, qrCode]
    );

    const newStudent = {
      id: result.insertId,
      name,
      strand,
      qr_code: qrCode,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      message: 'Student added successfully',
      student: newStudent,
    });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}