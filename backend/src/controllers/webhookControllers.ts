import {Request. Response} from 'express';
import sheetUpdateQueue from '../queues/sheetUpdateQueue';
import { WebHookPayload } sqlfrom '../types/types';
import pino from 'pino';
import { times } from 'lodash';
import { error } from 'console';

const logger = pino();

export async function handleWebhook(req: Request, res: Response)
{
    try{
        const { row, col, value , sheetId} : WebHookPayload = req.body;

        if(!row || !col || !sheetId || value === undefined){
            res.status(400).json({success: false,error: 'Invalid webhook payload'});
            return;
        }
        await sheetUpdateQueue.add('sheet_update', {
            row,
            col,
            value,
            sheetId,
            timestamp: Date.now()
        }, {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });

        logger.info({row, col,value} , 'Webhook job queued');

        res.status(202).json({
            success: true,
            message: 'update job queued',
        });
    }
    catch(error){
        logger.error({error}, ' Webhook processing failed');
        res.status(500).json({success: false, error: 'Internal server error'});
    }
}