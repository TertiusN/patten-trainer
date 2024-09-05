import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const leaderboardFile = path.join(process.cwd(), 'data', 'leaderboard.json');

const localStorage = {
  get: async () => {
    if (!fs.existsSync(leaderboardFile)) {
      return [];
    }
    const data = fs.readFileSync(leaderboardFile, 'utf-8');
    return JSON.parse(data);
  },
  set: async (value) => {
    const dirPath = path.dirname(leaderboardFile);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(leaderboardFile, JSON.stringify(value, null, 2), 'utf-8');
  }
};

const vercelKVStorage = {
  get: async () => await kv.get('leaderboard') || [],
  set: async (value) => await kv.set('leaderboard', value)
};

const storage = process.env.NODE_ENV === 'production' ? vercelKVStorage : localStorage;

export default storage;