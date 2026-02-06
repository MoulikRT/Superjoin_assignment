import {google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
import pino from 'pino';
import { auth } from 'google-auth-library';

const logger = pino();

const auth = new google.auth.GoogleAuth({
    projectId: process.env.GOOGLE_PROJECT_ID,
    credentials: {
        type: 'service_account',
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
});

const sheets = google.sheets({version: 'v4', auth});
logger.info('Google Sheets client initialized');
export { auth, sheets };
