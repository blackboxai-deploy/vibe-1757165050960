import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance_system',
  port: parseInt(process.env.DB_PORT || '3306'),
};

let connection: mysql.Connection | null = null;

export async function getConnection(): Promise<mysql.Connection> {
  if (!connection) {
    connection = await mysql.createConnection(config);
  }
  return connection;
}

export async function initializeDatabase(): Promise<void> {
  const conn = await getConnection();
  
  // Create database if it doesn't exist
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
  await conn.execute(`USE \`${config.database}\``);
  
  // Create users table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'teacher') DEFAULT 'teacher',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create students table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      strand ENUM('HUMSS', 'ABM', 'CSS', 'SMAW', 'AUTO', 'EIM') NOT NULL,
      qr_code VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create teachers table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create attendance table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      date DATE NOT NULL,
      time_in TIME,
      time_out TIME,
      remarks ENUM('present', 'late', 'absent') DEFAULT 'absent',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `);
  
  // Create sessions table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Insert default admin user if not exists
  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
  const adminCount = (rows as any)[0].count;
  
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await conn.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['admin', hashedPassword, 'admin']
    );
  }

  console.log('Database initialized successfully');
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

// Database query helper
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  const conn = await getConnection();
  const [rows] = await conn.execute(query, params);
  return rows;
}