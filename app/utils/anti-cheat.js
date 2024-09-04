const MAX_SCORE_PER_ROUND = 300;
const MAX_ROUNDS = 6000; // Equivalent to 5 hours of gameplay
const PERFECT_SCORE_THRESHOLD = 299; // Consider scores above this as "perfect"
const MAX_PERFECT_SCORE_RATIO = 0.1; // Maximum 10% of rounds can have perfect scores
const CONSISTENCY_CHECK_THRESHOLD = 0.9; // 90% of scores within a small range is suspicious

export function validateScore(score, rounds) {
  // Check if the number of rounds is within the acceptable range
  if (rounds.length > MAX_ROUNDS) {
    console.log('Too many rounds played. Possible cheating detected.');
    return false;
  }

  // Check if the total score is possible given the number of rounds
  const maxPossibleScore = rounds.length * MAX_SCORE_PER_ROUND;
  if (score > maxPossibleScore) {
    console.log('Score is higher than possible. Cheating detected.');
    return false;
  }

  // Check for too many perfect scores
  const perfectScores = rounds.filter(round => round.score > PERFECT_SCORE_THRESHOLD).length;
  if (perfectScores / rounds.length > MAX_PERFECT_SCORE_RATIO) {
    console.log('Too many perfect scores. Possible cheating detected.');
    return false;
  }

  // Check for unrealistic consistency
  const averageScore = score / rounds.length;
  const scoreVariance = rounds.reduce((variance, round) => 
    variance + Math.pow(round.score - averageScore, 2), 0) / rounds.length;
  const standardDeviation = Math.sqrt(scoreVariance);

  const consistentScores = rounds.filter(round => 
    Math.abs(round.score - averageScore) < standardDeviation).length;
  
  if (consistentScores / rounds.length > CONSISTENCY_CHECK_THRESHOLD) {
    console.log('Scores are unrealistically consistent. Possible cheating detected.');
    return false;
  }

  // Additional checks can be added here
  // For example, checking the time between rounds, or the distribution of scores

  return true;
}

export function calculateServerSideScore(rounds) {
  let totalScore = 0;
  for (const round of rounds) {
    if (round.actual.direction.toLowerCase() === round.prediction.direction.toLowerCase()) {
      const accuracy = Math.abs(round.prediction.percentage - Math.abs(round.actual.percentage));
      const roundScore = 100 + 200 * Math.exp(-3 * accuracy);
      totalScore += Math.min(roundScore, MAX_SCORE_PER_ROUND); // Ensure no round exceeds MAX_SCORE_PER_ROUND
    }
  }
  return totalScore;
}