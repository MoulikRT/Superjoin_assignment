import { Request, Response } from 'express';
import pool from '../config/database';
import { SQLPayload } from '../types/types';
import pino from 'pino';

const logger = pino();

export async function executeSQL(req: Request, res: Response) {
    try {
        const { query }: SQLPayload = req.body;
        const upperQuery = query.trim().toUpperCase();

        let modifiedQuery = query;

        if (upperQuery.startsWith('INSERT')) {
            if (!query.includes('last_modified_by')) {
                modifiedQuery = query.replace(
                    /VALUES\s*\(/i,
                    "VALUES('system_service', "
                );
            }
        }
    
        else if (upperQuery.startsWith('UPDATE')) {
            if (!query.includes('last_modified_by')) {
                modifiedQuery = query.replace(
                    /SET\s+/i,
                    "SET last_modified_by='system_service', "
                );
            }
        }
        

        const [result] = await pool.query(modifiedQuery);

        logger.info({ query }, 'SQL executed successfully');

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        logger.error({ error }, 'SQL execution failed');
        res.status(400).json({
            success: false,
            error: error.message || 'SQL execution failed',
        });
    }
}