import { redis } from 'googleapis/build/src/apis/redis';
import pool from '../config/database';
import { sheets } from '../config/google';
import redisClient from '../config/redis';
import pino from 'pino';

const logger = pino();

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const POLL_INTERVAL = 3000;

export class CDCMonitor{
    private lastCheckedAt: String;
    private isRunning : boolean;
    private intervalID: NodeJS.Timeout | null;
    
    constructor(){
        this.lastCheckedAt = new Date().toISOString();
        this.isRunning = false;
        this.intervalID = null; 
    }

    async start() {
        if(this.isRunning)
        {
            logger.warn('CDC Monitor is already running');
            return;
        }
        this.isRunning = true;
        logger.info('Starting CDC Monitor');


        this.intervalID = setInterval(async()=>{
            try{
                await this.pollChanges();

            }
            catch(err)
            {
                logger.error({err},'Error polling changes in CDC Monitor');
            }
        }, POLL_INTERVAL);
    }
    async stop() {
        if(this.intervalID)
        {
            clearInterval(this.intervalID);
            this.intervalID = null;

        }
        this.isRunning = false;
        logger.info("CDC Monitor stopped");

    }

    private async pollChanges(){
        try{
            const[changes] = await pool.query<any[]>(
                `SELECT * FROM users 
                WHERE updated_at > ? ORDER BY updated_at ASC`,
                [this.lastCheckedAt]
            );

            if(changes.length === 0)    return;
            logger.info({count : changes.length}, 'Changes detected');

            for(const change of changes){
                await this.processChange(change);
            }
            this.lastCheckedAt = new Date().toISOString();
        }
        catch(err){
            logger.error({err}, 'Error polling changes');
        }
    }
    private async processChange(change: any){
        const { row_number, column_name, value,last_modified_by} = change;

        if(last_modified_by === 'user'){
            logger.info({row: row_number, col: column_name, value}, 
                'Skipping -change from google sheets'
            );
            return;
        }

        if(last_modified_by === 'system_service'){
            logger.info({row: row_number, col: column_name},
                'Skipping - change from sql endpoint'
            );
            return;
        }

        //sync if comes from other sourcces
        try{
            const range = `${column_name}${row_number}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[value]],
                },
            });

            const ignoreKey = `ignore:${row_number}:${column_name}`;
            await redisClient.set(ignoreKey, '1','EX', 10);

            logger.info(
                {row: row_number, col: column_name, value},
                'Change synced to Google Sheets'
            );
        }catch(err){
            logger.error({err, row: row_number, col: column_name}, 'Error syncing change to Google Sheets');
        }
    }
}

export default new CDCMonitor();