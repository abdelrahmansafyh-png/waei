export type GameResultPayload = {
  type: "RASHID_GAME_RESULT";
  source?: "game" | "story";
  completed?: boolean;
  score?: number;
  maxScore?: number;
  percentage?: number;
  errors?: number;
};

export function calculateXp(score = 0, pointsPerCorrect = 10) {
  return Math.max(0, score) * pointsPerCorrect;
}
