import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

// Get the path to the leaderboard file
const leaderboardFile = path.join(process.cwd(), 'data', 'leaderboard.json');

// Helper to read leaderboard data
const readLeaderboard = () => {
  if (!existsSync(leaderboardFile)) {
    writeFileSync(leaderboardFile, JSON.stringify([]), 'utf-8');
  }

  try {
    const data = readFileSync(leaderboardFile, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

// Helper to write leaderboard data
const writeLeaderboard = (data) => {
  writeFileSync(leaderboardFile, JSON.stringify(data, null, 2), 'utf-8');
};

export async function GET(req, res) {
  const leaderboard = readLeaderboard();
  return new Response(JSON.stringify(leaderboard), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(req, res) {
  const body = await req.json();
  const { name, score } = body;

  if (!name || typeof score !== 'number') {
    return new Response(JSON.stringify({ error: 'Invalid name or score' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const leaderboard = readLeaderboard();
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score); // Sort by score, highest first
  
  // Limit the leaderboard to top 20 scores
  const topScores = leaderboard.slice(0, 10);

  writeLeaderboard(topScores);

  return new Response(JSON.stringify({ message: 'Score added successfully!' }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
