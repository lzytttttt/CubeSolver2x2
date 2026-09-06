import { CornerPieceState, FaceletColors, FaceName, MoveName, SolutionStep } from '../types/cube';
import {
  applyMoveToState,
  MOVE_DESCRIPTIONS,
  validateAndExtractState,
} from './cubeMath';

// Moves allowed in phase 2 that keep corner 7 (DBL) fixed
const P2_MOVES: MoveName[] = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];

// All 18 moves on the 2x2 cube
const ALL_18_MOVES: MoveName[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
];

function getMoveFace(m: MoveName): FaceName {
  return m[0] as FaceName;
}

// Compact state key
export function getStateKey(state: CornerPieceState): string {
  return state.permutation.join('') + state.orientation.join('');
}

// Invert move
function invertMove(m: MoveName): MoveName {
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, 1) as MoveName;
  return `${m}'` as MoveName;
}

// Precomputed backward table from solved state up to depth 6
let backwardTable: Map<string, MoveName[]> | null = null;

export function initBackwardTable(): Map<string, MoveName[]> {
  if (backwardTable) return backwardTable;

  const table = new Map<string, MoveName[]>();
  const solvedState: CornerPieceState = {
    permutation: [0, 1, 2, 3, 4, 5, 6, 7],
    orientation: [0, 0, 0, 0, 0, 0, 0, 0],
  };

  const startKey = getStateKey(solvedState);
  table.set(startKey, []);

  let currentLevel: { state: CornerPieceState; path: MoveName[]; lastFace: FaceName | null }[] = [
    { state: solvedState, path: [], lastFace: null },
  ];

  for (let depth = 1; depth <= 6; depth++) {
    const nextLevel: { state: CornerPieceState; path: MoveName[]; lastFace: FaceName | null }[] = [];

    for (const item of currentLevel) {
      for (const m of P2_MOVES) {
        const face = getMoveFace(m);
        if (face === item.lastFace) continue;

        const nextState = applyMoveToState(item.state, m);
        const key = getStateKey(nextState);

        if (!table.has(key)) {
          const fullPath = [...item.path, m];
          const pathToSolved = fullPath.slice().reverse().map(invertMove);
          table.set(key, pathToSolved);
          nextLevel.push({ state: nextState, path: fullPath, lastFace: face });
        }
      }
    }
    currentLevel = nextLevel;
  }

  backwardTable = table;
  return backwardTable;
}

// Phase 1: Fast BFS to align corner 7 in slot 7 with orientation 0
function alignPiece7(startState: CornerPieceState): { moves: MoveName[]; state: CornerPieceState } | null {
  if (startState.permutation[7] === 7 && startState.orientation[7] === 0) {
    return { moves: [], state: startState };
  }

  const queue: { state: CornerPieceState; path: MoveName[]; lastFace: FaceName | null }[] = [
    { state: startState, path: [], lastFace: null },
  ];

  while (queue.length > 0) {
    const cur = queue.shift()!;

    if (cur.state.permutation[7] === 7 && cur.state.orientation[7] === 0) {
      return { moves: cur.path, state: cur.state };
    }

    if (cur.path.length >= 3) continue;

    for (const m of ALL_18_MOVES) {
      const face = getMoveFace(m);
      if (face === cur.lastFace) continue;

      const nextState = applyMoveToState(cur.state, m);
      queue.push({
        state: nextState,
        path: [...cur.path, m],
        lastFace: face,
      });
    }
  }

  return null;
}

// Phase 2: Solve state where piece 7 is at slot 7 with ori 0 using U, R, F
function solvePhase2(startState: CornerPieceState): MoveName[] | null {
  const bTable = initBackwardTable();
  const startKey = getStateKey(startState);

  if (bTable.has(startKey)) {
    return bTable.get(startKey)!;
  }

  let currentLevel: { state: CornerPieceState; path: MoveName[]; lastFace: FaceName | null }[] = [
    { state: startState, path: [], lastFace: null },
  ];

  for (let depth = 1; depth <= 5; depth++) {
    const nextLevel: { state: CornerPieceState; path: MoveName[]; lastFace: FaceName | null }[] = [];

    for (const item of currentLevel) {
      for (const m of P2_MOVES) {
        const face = getMoveFace(m);
        if (face === item.lastFace) continue;

        const nextState = applyMoveToState(item.state, m);
        const key = getStateKey(nextState);

        if (bTable.has(key)) {
          return [...item.path, m, ...bTable.get(key)!];
        }

        nextLevel.push({ state: nextState, path: [...item.path, m], lastFace: face });
      }
    }
    currentLevel = nextLevel;
  }

  return null;
}

// Cleanly cancel adjacent same-face moves (e.g. U + U = U2, U + U' = none)
export function simplifyMoves(moves: MoveName[]): MoveName[] {
  const angleMap: Record<string, number> = { '': 1, "'": 3, '2': 2 };
  const suffixMap: Record<number, string> = { 1: '', 2: '2', 3: "'" };
  const result: MoveName[] = [];

  for (const m of moves) {
    if (result.length === 0) {
      result.push(m);
      continue;
    }

    const prev = result[result.length - 1];
    const prevFace = prev[0];
    const currFace = m[0];

    if (prevFace === currFace) {
      const prevSuffix = prev.slice(1);
      const currSuffix = m.slice(1);
      const prevAng = angleMap[prevSuffix] || 1;
      const currAng = angleMap[currSuffix] || 1;
      const totalAng = (prevAng + currAng) % 4;

      result.pop();
      if (totalAng > 0) {
        result.push(`${prevFace}${suffixMap[totalAng]}` as MoveName);
      }
    } else {
      result.push(m);
    }
  }

  return result;
}

export interface SolveResult {
  success: boolean;
  error?: string;
  isAlreadySolved?: boolean;
  moves: MoveName[];
  steps: SolutionStep[];
  stepCount: number;
}

// Main solve function: handles any valid 2x2 cube state
export function solveCube(facelets: FaceletColors): SolveResult {
  const val = validateAndExtractState(facelets);
  if (!val.valid || !val.state) {
    return {
      success: false,
      error: val.error || '魔方状态不合法',
      moves: [],
      steps: [],
      stepCount: 0,
    };
  }

  const state = val.state;

  // Check if already solved
  let isSolved = true;
  for (let i = 0; i < 8; i++) {
    if (state.permutation[i] !== i || state.orientation[i] !== 0) {
      isSolved = false;
      break;
    }
  }

  if (isSolved) {
    return {
      success: true,
      isAlreadySolved: true,
      moves: [],
      steps: [],
      stepCount: 0,
    };
  }

  // Phase 1: Align piece 7 (DBL) to slot 7 with orientation 0
  const p1 = alignPiece7(state);
  if (!p1) {
    return {
      success: false,
      error: '未能定位基准角块，请检查魔方颜色输入',
      moves: [],
      steps: [],
      stepCount: 0,
    };
  }

  // Phase 2: Solve remaining cube with U, R, F
  const p2Moves = solvePhase2(p1.state);
  if (!p2Moves) {
    return {
      success: false,
      error: '未能找到解法，请检查魔方状态是否合法',
      moves: [],
      steps: [],
      stepCount: 0,
    };
  }

  const rawMoves = [...p1.moves, ...p2Moves];
  const finalMoves = simplifyMoves(rawMoves);

  const steps: SolutionStep[] = finalMoves.map((m, idx) => ({
    stepNumber: idx + 1,
    move: m,
    notation: m,
    description: MOVE_DESCRIPTIONS[m] || `${m} 旋转`,
  }));

  return {
    success: true,
    isAlreadySolved: finalMoves.length === 0,
    moves: finalMoves,
    steps,
    stepCount: finalMoves.length,
  };
}

// Generate random scramble moves using standard 2x2 tournament moves
export function generateRandomScramble(length = 9): MoveName[] {
  const moves: MoveName[] = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];
  const scramble: MoveName[] = [];
  let lastFace: string | null = null;

  for (let i = 0; i < length; i++) {
    const candidates = moves.filter((m) => m[0] !== lastFace);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    scramble.push(chosen);
    lastFace = chosen[0];
  }

  return scramble;
}
