import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { config } from '../config/index.js';

const TASKS_FILE = join(config.dataPath, 'tasks.json');
const TOKENS_FILE = join(config.dataPath, 'tokens.json');
const PREFERENCES_FILE = join(config.dataPath, 'user-preferences.json');

// Generic file operations
async function readJsonFile(filePath, defaultValue = null) {
  try {
    if (!existsSync(filePath)) {
      return defaultValue;
    }
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

async function writeJsonFile(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Token operations (legacy - global tokens)
export async function getTokens() {
  return readJsonFile(TOKENS_FILE, null);
}

export async function saveTokens(tokens) {
  await writeJsonFile(TOKENS_FILE, tokens);
}

export async function clearTokens() {
  if (existsSync(TOKENS_FILE)) {
    await writeFile(TOKENS_FILE, '', 'utf-8');
  }
}

// User-specific token operations
const USER_TOKENS_FILE = join(config.dataPath, 'user-tokens.json');

export async function getUserTokens(userId) {
  if (!userId) {
    // Fallback to legacy global tokens for anonymous users
    return getTokens();
  }
  const allTokens = await readJsonFile(USER_TOKENS_FILE, {});
  return allTokens[userId] || null;
}

export async function saveUserTokens(userId, tokens) {
  if (!userId) {
    // Fallback to legacy global tokens for anonymous users
    return saveTokens(tokens);
  }
  const allTokens = await readJsonFile(USER_TOKENS_FILE, {});
  allTokens[userId] = tokens;
  await writeJsonFile(USER_TOKENS_FILE, allTokens);
}

export async function clearUserTokens(userId) {
  if (!userId) {
    return clearTokens();
  }
  const allTokens = await readJsonFile(USER_TOKENS_FILE, {});
  delete allTokens[userId];
  await writeJsonFile(USER_TOKENS_FILE, allTokens);
}

// Task operations
export async function getTasks() {
  const data = await readJsonFile(TASKS_FILE, { tasks: [] });
  return data.tasks;
}

export async function saveTasks(tasks) {
  await writeJsonFile(TASKS_FILE, { tasks });
}

export async function getTaskById(id) {
  const tasks = await getTasks();
  return tasks.find(t => t.id === id);
}

export async function createTask(task) {
  const tasks = await getTasks();
  tasks.push(task);
  await saveTasks(tasks);
  return task;
}

export async function updateTask(id, updates) {
  const tasks = await getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) {
    throw new Error('Task not found');
  }
  tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
  await saveTasks(tasks);
  return tasks[index];
}

export async function deleteTask(id) {
  const tasks = await getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) {
    throw new Error('Task not found');
  }
  await saveTasks(filtered);
}

// Preferences operations
export async function getPreferences() {
  return readJsonFile(PREFERENCES_FILE, {
    dailyWorkDuration: 480,
    maxSessionLength: 120,
    defaultSessionLength: 120,
    workingHours: { start: '09:00', end: '17:00' },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}

export async function savePreferences(preferences) {
  await writeJsonFile(PREFERENCES_FILE, preferences);
}
