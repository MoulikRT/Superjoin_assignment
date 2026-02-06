import { Queue } from 'bullmq';
import redisClient from '../config/redis';
import pino from 'pino';

const logger = pino();

const sheetUpdateQueue = new Queue('sheet_update', {
    connection: redisClient,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

logger.info('Sheet update queue created');

export default sheetUpdateQueue;