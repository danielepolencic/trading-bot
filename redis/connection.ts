import * as Redis from 'ioredis';

export const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export {Redis} from 'ioredis';