import pool from '../config/database';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const logger = pino();

export async function initializeDatabase() {
    try {
        const sqlPath = path.join(__dirname, '../../scripts/init-db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        const statements = sql.split(';')
                              .map(stmt => stmt.trim())
                              .filter(stmt => stmt.length > 0);

        for (const stmt of statements) {
            await pool.query(stmt);
        }
        logger.info('Database initialized successfully');
    }
    catch (err) {
        logger.error({ err }, 'Database initialization failed');
        throw err;
    }
}

export async function testDatabaseConnection() {
     try {
        const [rows] = await pool.query('SELECT 1 as test');
        logger.info('Database connection test successful');
        return true;
    } 
    catch (error) {
        logger.error({ error }, 'Database connection test failed');
        return false;
    }   
}