import {Worker,Job} from 'bullmq';
import redisCLient from '../config/redis';
import pool from '../config/database';
import { JobData } from '../types/types';
import pino from 'pino';

const logger = pino();

const sheetUpdateWorker = new Worker(
    'sheet-update',
    async(job: Job<JobData>) => {
        const { row, col, value, sheetId, timestamp } = job.data;
        try {
            logger.info({row, col, value, sheetId}, 'processing sheet update jon');
            
            const [checking] = await pool.query<any[]>(
                'SELECT * FROM users WHERE row_number = ? AND column_name = ?',
                [row,col]
            );
            if(checking.length > 0){
                await pool.query(
                    'UPDATE users SET value = ?,cell_value = ?, last_modified_by = ?,updated_at = NOW() WHERE row_number = ? AND column_name = ?',
                    [value, value, 'user', row, col]
                );
                logger.info({row, col, value}, 'Sheet update successful to value: ' + value); 
            }

            else{// inserting cell
                await pool.query(
                    'INSERT INTO users (row_number, column_name, value, cell_value, last_modified_by) VALUES (?, ?, ?, ?, ?)',
                    [row, col, value, value, 'user']
                );
                logger.info({row, col, value}, 'Sheet insert successful with value: ' + value);
            }
            
            return {success: true, row,col,value};
        } catch (error) {
            logger.error({error}, 'Error processing sheet update job');
            throw error;
        }
    },
    { connection: redisCLient,
        concurrency: 5,
        limiter: {
            max: 10,
            duration : 1000,
        },
     }
);

sheetUpdateWorker.on('completed', (job) => {
    logger.info({jobId: job.id}, 'Sheet update job completed');
});

sheetUpdateWorker.on('failed', (job, err) => {
    logger.error({jobId: job?.id, error: err}, 'Sheet update job failed');
});

sheetUpdateWorker.on('error', (err) => {   
    logger.error({error: err}, 'Worker error');
});

export default sheetUpdateWorker;

