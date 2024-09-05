import storage from '../../utils/storage';
import { validateScore, calculateServerSideScore } from '../../utils/anti-cheat';

export async function GET() {
  const leaderboard = await storage.get();
  return new Response(JSON.stringify(leaderboard), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req) {
  const body = await req.json();
  const { playerName, score, rounds } = body;
  console.log('Rounds:', rounds);

  // Validate the score
  if (!validateScore(score, rounds)) {
    return new Response(JSON.stringify({ error: 'Invalid score detected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Calculate the score on the server side
  const serverCalculatedScore = calculateServerSideScore(rounds);
  console.log('Server calculated score:', serverCalculatedScore);
  console.log('Submitted score:', score);

  // Give a max 1 round margin of error
  if (Math.abs(serverCalculatedScore - score) > 300) {
    return new Response(JSON.stringify({ error: 'Score mismatch detected' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Add the score to the leaderboard
  let leaderboard = await storage.get();
  leaderboard.push({ name: playerName, score: serverCalculatedScore });
  leaderboard.sort((a, b) => b.score - a.score);
  const topScores = leaderboard.slice(0, 10);
  
  await storage.set(topScores);

  return new Response(JSON.stringify({ message: 'Score submitted successfully', leaderboard: topScores }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}