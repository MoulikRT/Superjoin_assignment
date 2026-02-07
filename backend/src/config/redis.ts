import Redis from "ioredis";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();
const logger = pino();

const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,  
    enableReadyCheck: false,
});

client.on("connect", () => {
    logger.info("Connected to Redis");
});

client.on("error", (err) => {
    logger.error({ err }, "Redis connection error");
});

export default client;