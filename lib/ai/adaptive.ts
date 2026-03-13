export interface AdaptiveState {
  currentDifficulty: "easy" | "medium" | "hard";
  consecutiveCorrect: number;
  consecutiveWrong: number;
  questionHistory: { difficulty: string; scorePercent: number }[];
}

export function getNextDifficulty(state: AdaptiveState): "easy" | "medium" | "hard" {
  const lastEntry = state.questionHistory[state.questionHistory.length - 1];
  const scorePercent = lastEntry?.scorePercent ?? 50;

  // Student doing well → increase
  if (scorePercent >= 80 && state.consecutiveCorrect >= 2) {
    if (state.currentDifficulty === "easy") return "medium";
    return "hard";
  }

  // Student struggling → decrease
  if (scorePercent < 40 && state.consecutiveWrong >= 2) {
    if (state.currentDifficulty === "hard") return "medium";
    return "easy";
  }

  return state.currentDifficulty;
}

export function updateAdaptiveState(
  state: AdaptiveState,
  scorePercent: number
): AdaptiveState {
  const isCorrect = scorePercent >= 60;

  return {
    currentDifficulty: state.currentDifficulty,
    consecutiveCorrect: isCorrect ? state.consecutiveCorrect + 1 : 0,
    consecutiveWrong: !isCorrect ? state.consecutiveWrong + 1 : 0,
    questionHistory: [...state.questionHistory, { difficulty: state.currentDifficulty, scorePercent }],
  };
}
