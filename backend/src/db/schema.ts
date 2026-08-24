import db from '../config/database';

export function runSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','worker','citizen')),
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      population INTEGER,
      area_sqkm REAL,
      latitude REAL,
      longitude REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS water_assets (
      id TEXT PRIMARY KEY,
      asset_type TEXT NOT NULL,
      name TEXT NOT NULL,
      zone_id TEXT REFERENCES zones(id),
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'active',
      description TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      sensor_id TEXT UNIQUE NOT NULL,
      sensor_type TEXT NOT NULL,
      zone_id TEXT REFERENCES zones(id),
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'normal',
      last_reading REAL,
      unit TEXT,
      last_updated TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id TEXT PRIMARY KEY,
      sensor_id TEXT REFERENCES sensors(id),
      flow REAL,
      pressure REAL,
      tank_level REAL,
      consumption REAL,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS water_supply (
      id TEXT PRIMARY KEY,
      zone_id TEXT REFERENCES zones(id),
      date TEXT NOT NULL,
      supplied REAL NOT NULL,
      consumed REAL NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      citizen_id TEXT REFERENCES users(id),
      problem_type TEXT NOT NULL,
      description TEXT,
      latitude REAL,
      longitude REAL,
      photo_url TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'reported',
      assigned_worker_id TEXT REFERENCES users(id),
      zone_id TEXT REFERENCES zones(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id TEXT PRIMARY KEY,
      complaint_id TEXT REFERENCES complaints(id),
      worker_id TEXT REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      notes TEXT,
      before_photo TEXT,
      after_photo TEXT,
      due_date TEXT,
      zone_id TEXT REFERENCES zones(id),
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      alert_type TEXT NOT NULL,
      zone_id TEXT REFERENCES zones(id),
      sensor_id TEXT REFERENCES sensors(id),
      severity TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      type TEXT DEFAULT 'info',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
