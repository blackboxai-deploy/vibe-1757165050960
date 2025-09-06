import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { validateSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'text/csv') {
      return NextResponse.json({ message: 'Please provide a valid CSV file' }, { status: 400 });
    }

    const content = await file.text();
    const lines = content.split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    let imported = 0;
    const validStrands = ['HUMSS', 'ABM', 'CSS', 'SMAW', 'AUTO', 'EIM'];

    for (const line of dataLines) {
      const [name, strand] = line.split(',').map(field => field.replace(/"/g, '').trim());
      
      if (name && strand && validStrands.includes(strand)) {
        try {
          // Check if student already exists
          const existing = await executeQuery(
            'SELECT id FROM students WHERE name = ? AND strand = ?',
            [name, strand]
          );

          if (existing.length === 0) {
            const qrCode = `STU-${uuidv4().substring(0, 8).toUpperCase()}`;
            await executeQuery(
              'INSERT INTO students (name, strand, qr_code) VALUES (?, ?, ?)',
              [name, strand, qrCode]
            );
            imported++;
          }
        } catch (error) {
          console.error('Error importing student:', name, error);
        }
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${imported} students`,
      imported,
    });
  } catch (error) {
    console.error('Import students error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}