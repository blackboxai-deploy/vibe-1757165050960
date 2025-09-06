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

    const students = await executeQuery(
      'SELECT name, strand, qr_code FROM students ORDER BY name'
    );

    // Create CSV content
    const csvHeader = 'Name,Strand,QR Code\n';
    const csvContent = students.map((student: any) => 
      `"${student.name}","${student.strand}","${student.qr_code}"`
    ).join('\n');

    const csv = csvHeader + csvContent;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="students.csv"',
      },
    });
  } catch (error) {
    console.error('Export students error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}