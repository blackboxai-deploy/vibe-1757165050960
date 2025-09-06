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

    const attendance = await executeQuery(`
      SELECT 
        a.id, 
        a.student_id, 
        s.name as student_name, 
        s.strand,
        a.date, 
        a.time_in, 
        a.time_out, 
        a.remarks, 
        a.created_at
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      ORDER BY a.date DESC, a.time_in DESC
    `);

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
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

    const { student_id, date, time_in, time_out, remarks } = await request.json();

    if (!student_id || !date) {
      return NextResponse.json(
        { message: 'Student ID and date are required' },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this student on this date
    const existing = await executeQuery(
      'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
      [student_id, date]
    );

    if (existing.length > 0) {
      // Update existing attendance
      await executeQuery(
        'UPDATE attendance SET time_in = ?, time_out = ?, remarks = ? WHERE student_id = ? AND date = ?',
        [time_in, time_out || null, remarks || 'present', student_id, date]
      );

      return NextResponse.json({
        message: 'Attendance updated successfully',
        updated: true,
      });
    } else {
      // Create new attendance record
      const result = await executeQuery(
        'INSERT INTO attendance (student_id, date, time_in, time_out, remarks) VALUES (?, ?, ?, ?, ?)',
        [student_id, date, time_in, time_out || null, remarks || 'present']
      );

      return NextResponse.json({
        message: 'Attendance recorded successfully',
        id: result.insertId,
      });
    }
  } catch (error) {
    console.error('Record attendance error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}