import { Request, Response } from 'express';
import sheetUpdateQueue from '../queues/sheetUpdateQueue';
import redisClient from '../config/redis';
import { WebhookPayload } from '../types/types';
import pino from 'pino';

const logger = pino();

export async function handleWebhook(req: Request, res: Response) {
    try {
        const { row, col, value, sheetId } = req.body as WebhookPayload;

        if (!row || !col || value === undefined || !sheetId) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields: row, col, value, sheetId',
            });
            return;
        }

        // LOOP PREVENTION: Check if we recently synced this cell
        const ignoreKey = `ignore:${row}:${col}`;
        const shouldIgnore = await redisClient.get(ignoreKey);

        if (shouldIgnore) {
            logger.info({ row, col }, 'Ignoring webhook - CDC recently synced this cell');
            res.status(200).json({
                success: true,
                message: 'Change ignored (CDC sync)',
            });
            return;
        }

        await sheetUpdateQueue.add(
            'sheet_update',
            {
                row,
                col,
                value,
                sheetId,
                timestamp: Date.now(),
            },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            }
        );

        logger.info({ row, col, value }, 'Webhook job queued');

        res.status(202).json({
            success: true,
            message: 'Update queued for processing',
        });
    } catch (error) {
        logger.error({ error }, 'Webhook processing failed');
        res.status(500).json({
            success: false,
            error: 'Failed to queue update',
        });
    }
}