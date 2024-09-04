import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { validateScore, calculateServerSideScore } from '../../utils/anti-cheat';

const leaderboardFile = path.join(process.cwd(), 'data', 'leaderboard.json');

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

const writeLeaderboard = (data) => {
  writeFileSync(leaderboardFile, JSON.stringify(data, null, 2), 'utf-8');
};

export async function GET(req) {
  const leaderboard = readLeaderboard();
  return new Response(JSON.stringify(leaderboard), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const body = await req.json();
  const { playerName, score, rounds } = body;

  // Validate the score
  if (!validateScore(score, rounds)) {
    return new Response(JSON.stringify({ error: 'Invalid score detected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate the score on the server side
  const serverCalculatedScore = calculateServerSideScore(rounds);

  // Compare the server-calculated score with the submitted score
  if (Math.abs(serverCalculatedScore - score) > 0.01) {
    return new Response(JSON.stringify({ error: 'Score mismatch detected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Add the score to the leaderboard
  const leaderboard = readLeaderboard();
  leaderboard.push({ name: playerName, score: serverCalculatedScore });
  leaderboard.sort((a, b) => b.score - a.score);
  const topScores = leaderboard.slice(0, 10);
  writeLeaderboard(topScores);

  return new Response(JSON.stringify({ message: 'Score submitted successfully', leaderboard: topScores }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}