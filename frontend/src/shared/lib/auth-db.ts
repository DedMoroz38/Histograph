import { getPool } from "./pool";

export interface UserRow {
  id: number;
  email: string | null;
  password_hash: string | null;
  name: string | null;
  image: string | null;
  google_id: string | null;
  telegram_id: string | null;
  last_logged_in: Date | null;
  created_at: Date;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const { rows } = await getPool().query<UserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
  const { rows } = await getPool().query<UserRow>(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}

export async function getUserByGoogleId(googleId: string): Promise<UserRow | null> {
  const { rows } = await getPool().query<UserRow>(
    "SELECT * FROM users WHERE google_id = $1",
    [googleId]
  );
  return rows[0] ?? null;
}

export async function getUserByTelegramId(telegramId: string): Promise<UserRow | null> {
  const { rows } = await getPool().query<UserRow>(
    "SELECT * FROM users WHERE telegram_id = $1",
    [telegramId]
  );
  return rows[0] ?? null;
}

export async function touchLastLoggedIn(userId: number): Promise<void> {
  await getPool().query(
    "UPDATE users SET last_logged_in = NOW() WHERE id = $1",
    [userId]
  );
}

export async function createUser(
  email: string,
  passwordHash: string,
  name?: string
): Promise<number> {
  const { rows } = await getPool().query<{ id: number }>(
    "INSERT INTO users (email, password_hash, name, last_logged_in) VALUES ($1, $2, $3, NOW()) RETURNING id",
    [email, passwordHash, name ?? null]
  );
  return rows[0].id;
}

export async function upsertGoogleUser(
  googleId: string,
  email: string | null,
  name: string,
  image: string
): Promise<number> {
  const pool = getPool();

  // Case 1: existing email+password account → merge Google onto it
  if (email) {
    const { rows: byEmail } = await pool.query<{ id: number }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (byEmail.length > 0) {
      await pool.query(
        "UPDATE users SET google_id = $1, name = $2, image = $3, last_logged_in = NOW() WHERE id = $4",
        [googleId, name, image, byEmail[0].id]
      );
      return byEmail[0].id;
    }
  }

  // Case 2: existing Google account (re-sign-in) → refresh name/image
  const { rows: byGoogle } = await pool.query<{ id: number }>(
    "SELECT id FROM users WHERE google_id = $1",
    [googleId]
  );
  if (byGoogle.length > 0) {
    await pool.query(
      "UPDATE users SET name = $1, image = $2, last_logged_in = NOW() WHERE id = $3",
      [name, image, byGoogle[0].id]
    );
    return byGoogle[0].id;
  }

  // Case 3: brand-new Google user
  const { rows: inserted } = await pool.query<{ id: number }>(
    "INSERT INTO users (google_id, email, name, image, last_logged_in) VALUES ($1, $2, $3, $4, NOW()) RETURNING id",
    [googleId, email, name, image]
  );
  return inserted[0].id;
}

export async function upsertTelegramUser(
  telegramId: string,
  name: string,
  image?: string
): Promise<number> {
  const { rows } = await getPool().query<{ id: number }>(
    `INSERT INTO users (telegram_id, name, image, last_logged_in)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (telegram_id) DO UPDATE SET
       name           = EXCLUDED.name,
       image          = COALESCE(EXCLUDED.image, users.image),
       last_logged_in = NOW()
     RETURNING id`,
    [telegramId, name, image ?? null]
  );
  return rows[0].id;
}

// ── Watched videos ─────────────────────────────────────────────────────────

export async function getWatchedIds(userId: number): Promise<string[]> {
  const { rows } = await getPool().query<{ video_id: string }>(
    "SELECT video_id FROM user_watched WHERE user_id = $1",
    [userId]
  );
  return rows.map((r) => r.video_id);
}

export async function addWatched(userId: number, videoId: string): Promise<void> {
  await getPool().query(
    "INSERT INTO user_watched (user_id, video_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [userId, videoId]
  );
}

export async function removeWatched(userId: number, videoId: string): Promise<void> {
  await getPool().query(
    "DELETE FROM user_watched WHERE user_id = $1 AND video_id = $2",
    [userId, videoId]
  );
}

export async function mergeWatched(userId: number, videoIds: string[]): Promise<void> {
  if (videoIds.length === 0) return;
  await getPool().query(
    "INSERT INTO user_watched (user_id, video_id) SELECT $1, UNNEST($2::text[]) ON CONFLICT DO NOTHING",
    [userId, videoIds]
  );
}
