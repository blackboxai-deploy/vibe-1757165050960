import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { validateSession } from '@/lib/auth';

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

    const { studentId, scanMethod } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { message: 'Student ID is required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    // Define time boundaries
    const lateThreshold = '08:00'; // Consider late after 8 AM
    
    // Check if attendance already exists for today
    const existing = await executeQuery(
      'SELECT * FROM attendance WHERE student_id = ? AND date = ?',
      [studentId, today]
    );

    let remarks: 'present' | 'late' | 'absent' = 'present';
    let message = '';

    if (currentTime > lateThreshold) {
      remarks = 'late';
      message = 'Marked as late arrival';
    } else {
      remarks = 'present';
      message = 'Marked as present';
    }

    if (existing.length > 0) {
      // Update existing record if no time_in recorded yet, or update time_out
      const record = existing[0];
      
      if (!record.time_in) {
        // First scan of the day - record time_in
        await executeQuery(
          'UPDATE attendance SET time_in = ?, remarks = ? WHERE id = ?',
          [currentTime, remarks, record.id]
        );
        message = `Time in recorded: ${message}`;
      } else if (!record.time_out) {
        // Second scan - record time_out
        await executeQuery(
          'UPDATE attendance SET time_out = ? WHERE id = ?',
          [currentTime, record.id]
        );
        message = 'Time out recorded successfully';
        remarks = record.remarks; // Keep original remarks
      } else {
        message = 'Attendance already complete for today';
        remarks = record.remarks;
      }
    } else {
      // Create new attendance record
      await executeQuery(
        'INSERT INTO attendance (student_id, date, time_in, remarks) VALUES (?, ?, ?, ?)',
        [studentId, today, currentTime, remarks]
      );
      message = `Attendance recorded via ${scanMethod}: ${message}`;
    }

    // Get student info for response
    const students = await executeQuery(
      'SELECT name FROM students WHERE id = ?',
      [studentId]
    );

    const studentName = students.length > 0 ? students[0].name : 'Unknown Student';

    return NextResponse.json({
      message,
      studentName,
      remarks,
      time: currentTime,
      scanMethod,
    });
  } catch (error) {
    console.error('Record attendance error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}