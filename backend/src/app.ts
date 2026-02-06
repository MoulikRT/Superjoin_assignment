import express , { Express , Response, Request, NextFunction} from 'express'
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import pino from 'pino'
import { testDatabaseConnection } from './utils/dbInit';    
import redisClient from './config/redis';
import { sql } from 'googleapis/build/src/apis/sql';

import sqlRoutes from './routes/sqlroutes';
import webhookRoutes from './routes/webhook_routes'; 
dotenv.config();

const app: Express = express();
const logger = pino();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());
app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb',extended: true}));
app.use(express.static('public'));

//routes
app.use('/api/sql', sqlRoutes);
app.use('/api/webhook',webhookRoutes);

//logger middleware
app.use((req:Request, res:Response, next:NextFunction) => {
    const startTime = Date.now();

    res.on('finish', ()=> {
        const duration = Date.now() - startTime;
        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });
    next();
});

// Health endpoint - use GET not use()
app.get('/health', async (req:Request, res:Response) => {
    const dbConnected = await testDatabaseConnection();
    const redisConnected = redisClient.status === 'ready';
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        uptime: process.uptime(),
        services: {
            database: dbConnected ? 'connected' : 'disconnected',
            redis: redisConnected ? 'connected' : 'disconnected'
        }
    });
});

app.post('/api/webhook', (req:Request, res:Response) => {
    res.status(202).json({message: 'Webhook received'});
});

app.post('/api/sql/execute', (req:Request, res:Response) => {
    res.status(200).json({message: 'SQL executed'});
});

// 404 handler
app.use((req:Request, res:Response) => {
    res.status(404).json({error: 'Not Found'});
});

// Error handler
app.use((err:any, req:Request, res:Response, next:NextFunction)=>{
    logger.error(err);
    res.status(500).json({error: 'Internal Server Error'});
});

app.listen(PORT, ()=>{
    logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

export default app;