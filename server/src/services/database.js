import mysql from 'mysql2/promise';
import { config } from '../config/index.js';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function insert(sql, params = []) {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

export async function update(sql, params = []) {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result.affectedRows;
}

export async function testConnection() {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// User queries
export const userQueries = {
  async findBySupabaseId(supabaseId) {
    return queryOne('SELECT * FROM users WHERE supabase_id = ?', [supabaseId]);
  },

  async findByEmail(email) {
    return queryOne('SELECT * FROM users WHERE email = ?', [email]);
  },

  async create({ supabaseId, email, displayName, avatarUrl, role = 'user' }) {
    const id = await insert(
      `INSERT INTO users (supabase_id, email, display_name, avatar_url, role)
       VALUES (?, ?, ?, ?, ?)`,
      [supabaseId, email, displayName, avatarUrl, role]
    );
    return { id, supabaseId, email, displayName, avatarUrl, role };
  },

  async updateGoogleTokens(userId, refreshToken, expiresAt) {
    return update(
      `UPDATE users SET google_refresh_token = ?, google_token_expires_at = ? WHERE id = ?`,
      [refreshToken, expiresAt, userId]
    );
  },

  async updateSubscription(userId, tier, expiresAt) {
    return update(
      `UPDATE users SET subscription_tier = ?, subscription_expires_at = ? WHERE id = ?`,
      [tier, expiresAt, userId]
    );
  },

  async getById(id) {
    return queryOne('SELECT * FROM users WHERE id = ?', [id]);
  }
};

// Task queries
export const taskQueries = {
  async findByUserId(userId) {
    return query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  },

  async findPendingByUserId(userId) {
    return query(
      `SELECT * FROM tasks WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC`,
      [userId]
    );
  },

  async countByUserId(userId) {
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status != 'completed'`,
      [userId]
    );
    return result?.count || 0;
  },

  async create(userId, { title, description, estimatedMinutes, priority, dueDate }) {
    const id = await insert(
      `INSERT INTO tasks (user_id, title, description, estimated_minutes, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, description, estimatedMinutes, priority || 'medium', dueDate]
    );
    return { id, userId, title, description, estimatedMinutes, priority, dueDate, status: 'pending' };
  },

  async update(taskId, userId, updates) {
    const fields = [];
    const values = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.estimatedMinutes !== undefined) { fields.push('estimated_minutes = ?'); values.push(updates.estimatedMinutes); }
    if (updates.priority !== undefined) { fields.push('priority = ?'); values.push(updates.priority); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.dueDate !== undefined) { fields.push('due_date = ?'); values.push(updates.dueDate); }
    if (updates.calendarEventId !== undefined) { fields.push('calendar_event_id = ?'); values.push(updates.calendarEventId); }

    if (fields.length === 0) return 0;

    values.push(taskId, userId);
    return update(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
  },

  async delete(taskId, userId) {
    return update('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
  },

  async getById(taskId, userId) {
    return queryOne('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
  }
};

// User preferences queries
export const preferencesQueries = {
  async findByUserId(userId) {
    return queryOne('SELECT * FROM user_preferences WHERE user_id = ?', [userId]);
  },

  async upsert(userId, prefs) {
    const existing = await this.findByUserId(userId);

    if (existing) {
      const fields = [];
      const values = [];

      if (prefs.workStartTime !== undefined) { fields.push('work_start_time = ?'); values.push(prefs.workStartTime); }
      if (prefs.workEndTime !== undefined) { fields.push('work_end_time = ?'); values.push(prefs.workEndTime); }
      if (prefs.preferredSessionMinutes !== undefined) { fields.push('preferred_session_minutes = ?'); values.push(prefs.preferredSessionMinutes); }
      if (prefs.bufferMinutes !== undefined) { fields.push('buffer_minutes = ?'); values.push(prefs.bufferMinutes); }
      if (prefs.workingDays !== undefined) { fields.push('working_days = ?'); values.push(JSON.stringify(prefs.workingDays)); }
      if (prefs.timezone !== undefined) { fields.push('timezone = ?'); values.push(prefs.timezone); }

      if (fields.length > 0) {
        values.push(userId);
        await update(`UPDATE user_preferences SET ${fields.join(', ')} WHERE user_id = ?`, values);
      }
    } else {
      await insert(
        `INSERT INTO user_preferences (user_id, work_start_time, work_end_time, preferred_session_minutes, buffer_minutes, working_days, timezone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          prefs.workStartTime || '09:00:00',
          prefs.workEndTime || '17:00:00',
          prefs.preferredSessionMinutes || 60,
          prefs.bufferMinutes || 15,
          JSON.stringify(prefs.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri']),
          prefs.timezone || 'America/New_York'
        ]
      );
    }

    return this.findByUserId(userId);
  }
};
