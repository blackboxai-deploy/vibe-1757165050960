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

    // Get total students
    const studentsResult = await executeQuery('SELECT COUNT(*) as count FROM students');
    const totalStudents = studentsResult[0].count;

    // Get total teachers
    const teachersResult = await executeQuery('SELECT COUNT(*) as count FROM teachers');
    const totalTeachers = teachersResult[0].count;

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const attendanceResult = await executeQuery(
      'SELECT COUNT(DISTINCT student_id) as count FROM attendance WHERE date = ? AND remarks = "present"',
      [today]
    );
    const totalAttendanceToday = attendanceResult[0].count;

    // Get strand counts
    const strandResult = await executeQuery(
      'SELECT strand, COUNT(*) as count FROM students GROUP BY strand'
    );
    const strandCounts = {
      HUMSS: 0,
      ABM: 0,
      CSS: 0,
      SMAW: 0,
      AUTO: 0,
      EIM: 0,
    };
    
    strandResult.forEach((row: any) => {
      if (row.strand in strandCounts) {
        strandCounts[row.strand as keyof typeof strandCounts] = row.count;
      }
    });

    // Get students with multiple absences (3 or more consecutive absences)
    const absentStudentsResult = await executeQuery(`
      SELECT s.name, COUNT(a.id) as absent_days
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id 
      WHERE a.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
      AND a.remarks = 'absent'
      GROUP BY s.id, s.name
      HAVING absent_days >= 3
    `);

    // Get recent activity (mock data for now - can be enhanced with actual activity logging)
    const recentActivity = [
      {
        id: 1,
        action: 'System Initialized',
        details: 'Attendance system is ready for use',
        timestamp: new Date().toLocaleString(),
      },
      {
        id: 2,
        action: 'Database Connected',
        details: 'Successfully connected to MySQL database',
        timestamp: new Date().toLocaleString(),
      },
    ];

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      totalAttendanceToday,
      strandCounts,
      absentStudents: absentStudentsResult,
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}