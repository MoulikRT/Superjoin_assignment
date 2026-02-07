import {Request, Response, NextFunction} from 'express';
import pino from 'pino';

const logger = pino();

const BLOCKED_KEYWORDS = [
    'DROP', 'TRUNCATE', 'CREATE DATABASE', 'DROP DATABASE', 'GRANT', 'REVOKE',
]

export function sqlGuard(req: Request, res : Response, next: NextFunction) {
    const {query} = req.body;
    if(!query || typeof query !== 'string') {
        res.status(400).json({error: 'Invalid SQL query'});
        return;
    }

    const upperQuery = query.trim().toUpperCase();

    for(const keyword of BLOCKED_KEYWORDS) {
        if(upperQuery.includes(keyword)) {
            logger.warn({query}, `Blocked potentially dangerous SQL query containing keyword: ${keyword}`);
            res.status(403).json({error: `"${keyword}" commands are not allowed`});
            return;
        }
    }
    next();
}