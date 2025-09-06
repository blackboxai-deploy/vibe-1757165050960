import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { executeQuery } from './database';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'teacher';
}

interface SessionData {
  userId: number;
  username: string;
  role: 'admin' | 'teacher';
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: SessionData): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): SessionData | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionData;
  } catch (error) {
    return null;
  }
}

export async function loginUser(username: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const users = await executeQuery(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return null;
    }

    const sessionData: SessionData = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = generateToken(sessionData);

    // Store session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await executeQuery(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

export async function registerUser(username: string, password: string, role: 'admin' | 'teacher' = 'teacher'): Promise<User | null> {
  try {
    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return null; // User already exists
    }

    const hashedPassword = await hashPassword(password);
    const result = await executeQuery(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    return {
      id: result.insertId,
      username,
      role,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

export async function validateSession(token: string): Promise<User | null> {
  try {
    const sessionData = verifyToken(token);
    if (!sessionData) {
      return null;
    }

    // Check if session exists in database and is not expired
    const sessions = await executeQuery(
      'SELECT s.*, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > NOW()',
      [token]
    );

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];
    return {
      id: session.user_id,
      username: session.username,
      role: session.role,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function logoutUser(token: string): Promise<boolean> {
  try {
    await executeQuery('DELETE FROM sessions WHERE token = ?', [token]);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}