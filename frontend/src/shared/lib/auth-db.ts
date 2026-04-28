import Database from "better-sqlite3";
import path from "path";

// Separate writable connection for auth operations
let _authDb: Database.Database | null = null;

function getAuthDb(): Database.Database {
  if (!_authDb) {
    const dbPath = path.join(process.cwd(), "..", "videos.db");
    _authDb = new Database(dbPath);
    _authDb.pragma("journal_mode = WAL");
    _authDb.pragma("foreign_keys = ON");
  }
  return _authDb;
}

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export function getUserByEmail(email: string): UserRow | null {
  return (getAuthDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow) ?? null;
}

export function createUser(email: string, passwordHash: string): number {
  const result = getAuthDb()
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, passwordHash);
  return result.lastInsertRowid as number;
}
