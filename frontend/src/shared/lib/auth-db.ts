import Database from "better-sqlite3";
import path from "path";

let _authDb: Database.Database | null = null;

function getAuthDb(): Database.Database {
  if (!_authDb) {
    const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "..", "videos.db");
    _authDb = new Database(dbPath);
    _authDb.pragma("journal_mode = WAL");
    _authDb.pragma("foreign_keys = ON");
    _ensureSchema(_authDb);
  }
  return _authDb;
}

function _ensureSchema(db: Database.Database): void {
  const cols = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(
    (r) => r.name
  );

  if (!cols.includes("google_id")) {
    // Recreate users table with OAuth columns (handles first-run before Python migration)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users_tmp_oauth (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        email          TEXT    UNIQUE,
        password_hash  TEXT,
        name           TEXT,
        image          TEXT,
        google_id      TEXT    UNIQUE,
        telegram_id    TEXT    UNIQUE,
        last_logged_in TEXT,
        created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO users_tmp_oauth (id, email, password_hash, created_at)
        SELECT id, email, password_hash, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_tmp_oauth RENAME TO users;
    `);
  } else if (!cols.includes("last_logged_in")) {
    db.exec("ALTER TABLE users ADD COLUMN last_logged_in TEXT");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_watched (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      video_id   TEXT    NOT NULL,
      watched_at TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, video_id)
    )
  `);
}

export interface UserRow {
  id: number;
  email: string | null;
  password_hash: string | null;
  name: string | null;
  image: string | null;
  google_id: string | null;
  telegram_id: string | null;
  last_logged_in: string | null;
  created_at: string;
}

export function getUserByEmail(email: string): UserRow | null {
  return (
    (getAuthDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow) ?? null
  );
}

export function getUserById(id: number): UserRow | null {
  return (
    (getAuthDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow) ?? null
  );
}

export function getUserByGoogleId(googleId: string): UserRow | null {
  return (
    (getAuthDb()
      .prepare("SELECT * FROM users WHERE google_id = ?")
      .get(googleId) as UserRow) ?? null
  );
}

export function getUserByTelegramId(telegramId: string): UserRow | null {
  return (
    (getAuthDb()
      .prepare("SELECT * FROM users WHERE telegram_id = ?")
      .get(telegramId) as UserRow) ?? null
  );
}

export function touchLastLoggedIn(userId: number): void {
  getAuthDb()
    .prepare("UPDATE users SET last_logged_in = datetime('now') WHERE id = ?")
    .run(userId);
}

export function createUser(
  email: string,
  passwordHash: string,
  name?: string
): number {
  const result = getAuthDb()
    .prepare(
      "INSERT INTO users (email, password_hash, name, last_logged_in) VALUES (?, ?, ?, datetime('now'))"
    )
    .run(email, passwordHash, name ?? null);
  return result.lastInsertRowid as number;
}

export function upsertGoogleUser(
  googleId: string,
  email: string | null,
  name: string,
  image: string
): number {
  const db = getAuthDb();

  // Case 1: existing email+password account → merge Google onto it
  if (email) {
    const byEmail = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email) as { id: number } | undefined;
    if (byEmail) {
      db.prepare(
        "UPDATE users SET google_id = ?, name = ?, image = ?, last_logged_in = datetime('now') WHERE id = ?"
      ).run(googleId, name, image, byEmail.id);
      return byEmail.id;
    }
  }

  // Case 2: existing Google account (re-sign-in) → refresh name/image
  const byGoogle = db
    .prepare("SELECT id FROM users WHERE google_id = ?")
    .get(googleId) as { id: number } | undefined;
  if (byGoogle) {
    db.prepare(
      "UPDATE users SET name = ?, image = ?, last_logged_in = datetime('now') WHERE id = ?"
    ).run(name, image, byGoogle.id);
    return byGoogle.id;
  }

  // Case 3: brand-new Google user
  const r = db
    .prepare(
      "INSERT INTO users (google_id, email, name, image, last_logged_in) VALUES (?, ?, ?, ?, datetime('now'))"
    )
    .run(googleId, email, name, image);
  return r.lastInsertRowid as number;
}

export function upsertTelegramUser(
  telegramId: string,
  name: string,
  image?: string
): number {
  const db = getAuthDb();
  db.prepare(
    "INSERT OR IGNORE INTO users (telegram_id, name, image) VALUES (?, ?, ?)"
  ).run(telegramId, name, image ?? null);
  db.prepare(
    "UPDATE users SET name = ?, image = COALESCE(?, image), last_logged_in = datetime('now') WHERE telegram_id = ?"
  ).run(name, image ?? null, telegramId);
  const row = db.prepare("SELECT id FROM users WHERE telegram_id = ?").get(telegramId) as {
    id: number;
  };
  return row.id;
}

// ── Watched videos ─────────────────────────────────────────────────────────

export function getWatchedIds(userId: number): string[] {
  const rows = getAuthDb()
    .prepare("SELECT video_id FROM user_watched WHERE user_id = ?")
    .all(userId) as { video_id: string }[];
  return rows.map((r) => r.video_id);
}

export function addWatched(userId: number, videoId: string): void {
  getAuthDb()
    .prepare(
      "INSERT OR IGNORE INTO user_watched (user_id, video_id) VALUES (?, ?)"
    )
    .run(userId, videoId);
}

export function removeWatched(userId: number, videoId: string): void {
  getAuthDb()
    .prepare("DELETE FROM user_watched WHERE user_id = ? AND video_id = ?")
    .run(userId, videoId);
}

export function mergeWatched(userId: number, videoIds: string[]): void {
  const insert = getAuthDb().prepare(
    "INSERT OR IGNORE INTO user_watched (user_id, video_id) VALUES (?, ?)"
  );
  const insertMany = getAuthDb().transaction((ids: string[]) => {
    for (const id of ids) insert.run(userId, id);
  });
  insertMany(videoIds);
}
