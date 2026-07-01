import * as SQLite from 'expo-sqlite';

// Open a database, creating it if it doesn't exist.
const db = SQLite.openDatabaseSync('sleeptracker.db');

export function initializeDatabase() {
    db.execSync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS sleep_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            totalSleepTime REAL NOT NULL,
            sleepScore REAL NOT NULL,
            quality TEXT NOT NULL,
            notes TEXT
        );
        CREATE TABLE IF NOT EXISTS user_sleep_goals (
            userId TEXT NOT NULL,
            goal TEXT NOT NULL,
            PRIMARY KEY (userId, goal)
        );
    `);
}

export interface SleepSession {
    id: number;
    userId: string;
    startTime: string;
    endTime: string;
    totalSleepTime: number;
    sleepScore: number;
    quality: string;
    notes?: string;
}

export async function addSleepSession(session: Omit<SleepSession, 'id'>): Promise<void> {
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `INSERT INTO sleep_sessions (userId, startTime, endTime, totalSleepTime, sleepScore, quality, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            session.userId,
            session.startTime,
            session.endTime,
            session.totalSleepTime,
            session.sleepScore,
            session.quality,
            session.notes ?? '' // Ensure notes is not undefined
        );
    });
}

export async function getAllSessions(userId: string): Promise<SleepSession[]> {
    const results = await db.getAllAsync<SleepSession>(
        'SELECT * FROM sleep_sessions WHERE userId = ? ORDER BY startTime DESC',
        [userId]
    );
    return results;
}

export async function getRecentSessions(userId: string): Promise<SleepSession[]> {
    const results = await db.getAllAsync<SleepSession>(
        'SELECT * FROM sleep_sessions WHERE userId = ? ORDER BY startTime DESC LIMIT 7',
        [userId]
    );
    return results;
}

export async function saveUserSleepGoals(userId: string, goals: string[]) {
    await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM user_sleep_goals WHERE userId = ?', [userId]);
        for (const goal of goals) {
            await db.runAsync('INSERT INTO user_sleep_goals (userId, goal) VALUES (?, ?)', [userId, goal]);
        }
    });
} 