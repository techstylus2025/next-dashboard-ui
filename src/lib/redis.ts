import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI || null;
let client: Redis | null = null;
let available = false;
if (redisUrl) {
  try {
    client = new Redis(redisUrl);
    available = true;
    client.on('error', () => {
      available = false;
    });
  } catch (e) {
    client = null;
    available = false;
  }
}

export const redisAvailable = () => available && client !== null;

export async function redisGet(key: string) {
  if (!client) return null;
  try {
    const v = await client.get(key);
    if (!v) return null;
    return JSON.parse(v);
  } catch (e) {
    return null;
  }
}

export async function redisSet(key: string, value: any, ttlMs: number) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'PX', ttlMs);
  } catch (e) {
    // ignore
  }
}

export default client;
