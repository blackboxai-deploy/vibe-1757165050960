import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { initializeDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Initialize database on first request
    await initializeDatabase();
    
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const user = await registerUser(username, password, role);

    if (!user) {
      return NextResponse.json(
        { message: 'Username already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}