import Cube from 'cubejs';
import { CubeColor, FaceletColors, FaceName, MoveName, SolutionStep } from '../types/cube';
import { MOVE_DESCRIPTIONS } from './cubeMath';
import { SolveResult } from './cubeSolver';

let isSolverInitialized = false;

export function ensureSolverInit() {
  if (!isSolverInitialized) {
    try {
      Cube.initSolver();
      isSolverInitialized = true;
    } catch (e) {
      console.error('Failed to init Cube solver:', e);
    }
  }
}

// Immediate eager initialization
setTimeout(() => {
  ensureSolverInit();
}, 10);

const COLOR_TO_FACE: Record<CubeColor, string> = {
  white: 'U',
  yellow: 'D',
  green: 'F',
  blue: 'B',
  orange: 'L',
  red: 'R',
};

const FACE_TO_COLOR: Record<string, CubeColor> = {
  U: 'white',
  D: 'yellow',
  F: 'green',
  B: 'blue',
  L: 'orange',
  R: 'red',
};

export function getSolvedFacelets3x3(): FaceletColors {
  return {
    U: ['white', 'white', 'white', 'white', 'white', 'white', 'white', 'white', 'white'],
    D: ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow'],
    F: ['green', 'green', 'green', 'green', 'green', 'green', 'green', 'green', 'green'],
    B: ['blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue'],
    L: ['orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange', 'orange'],
    R: ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
  };
}

// Order of faces in cubejs: U (9), R (9), F (9), D (9), L (9), B (9)
export function faceletsToCubeString3x3(facelets: FaceletColors): string {
  const order: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  return order.map((f) => (facelets[f] || []).map((c) => COLOR_TO_FACE[c] || 'U').join('')).join('');
}

export function cubeStringToFacelets3x3(str: string): FaceletColors {
  const order: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const res: Partial<FaceletColors> = {};
  let offset = 0;
  for (const f of order) {
    const slice = str.slice(offset, offset + 9);
    res[f] = Array.from(slice).map((ch) => FACE_TO_COLOR[ch] || 'white');
    offset += 9;
  }
  return res as FaceletColors;
}

export function applyMoveToFacelets3x3(facelets: FaceletColors, move: MoveName): FaceletColors {
  try {
    ensureSolverInit();
    const str = faceletsToCubeString3x3(facelets);
    const cube = Cube.fromString(str);
    cube.move(move);
    return cubeStringToFacelets3x3(cube.asString());
  } catch {
    return facelets;
  }
}

export function validateFacelets3x3(facelets: FaceletColors): {
  valid: boolean;
  error?: string;
  counts: Record<CubeColor, number>;
  isSolved: boolean;
} {
  const counts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    orange: 0,
    red: 0,
  };

  const faces: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const f of faces) {
    const stickers = facelets[f] || [];
    for (let i = 0; i < 9; i++) {
      const c = stickers[i];
      if (c && counts[c] !== undefined) {
        counts[c]++;
      }
    }
  }

  const colors: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'orange', 'red'];
  const colorNames: Record<CubeColor, string> = {
    white: '白色',
    yellow: '黄色',
    green: '绿色',
    blue: '蓝色',
    orange: '橙色',
    red: '红色',
  };

  for (const c of colors) {
    if (counts[c] !== 9) {
      return {
        valid: false,
        error: `${colorNames[c]}色块为 ${counts[c]} 个（标准三阶魔方每种颜色应恰好为 9 个）`,
        counts,
        isSolved: false,
      };
    }
  }

  // Center pieces check (fixed orientation):
  const requiredCenters: Record<FaceName, CubeColor> = {
    U: 'white',
    D: 'yellow',
    F: 'green',
    B: 'blue',
    L: 'orange',
    R: 'red',
  };

  for (const f of faces) {
    if (facelets[f][4] !== requiredCenters[f]) {
      return {
        valid: false,
        error: `${f} 面的中心块颜色必须为 ${colorNames[requiredCenters[f]]}`,
        counts,
        isSolved: false,
      };
    }
  }

  // Check if solved
  let isSolved = true;
  for (const f of faces) {
    for (let i = 0; i < 9; i++) {
      if (facelets[f][i] !== requiredCenters[f]) {
        isSolved = false;
        break;
      }
    }
    if (!isSolved) break;
  }

  // Check physical state validity with Cube.fromString
  try {
    ensureSolverInit();
    const cubeStr = faceletsToCubeString3x3(facelets);
    Cube.fromString(cubeStr);
  } catch {
    return {
      valid: false,
      error: '魔方状态不符合物理规则（存在不可还原的角块/棱块朝向或奇偶校验错误），请检查色块填涂',
      counts,
      isSolved: false,
    };
  }

  return {
    valid: true,
    counts,
    isSolved,
  };
}

export function solveCube3x3(facelets: FaceletColors): SolveResult {
  const val = validateFacelets3x3(facelets);
  if (!val.valid) {
    return {
      success: false,
      error: val.error || '魔方状态不合法',
      moves: [],
      steps: [],
      stepCount: 0,
    };
  }

  if (val.isSolved) {
    return {
      success: true,
      isAlreadySolved: true,
      moves: [],
      steps: [],
      stepCount: 0,
    };
  }

  try {
    ensureSolverInit();
    const cubeStr = faceletsToCubeString3x3(facelets);
    const cube = Cube.fromString(cubeStr);
    const solutionStr = cube.solve();

    if (!solutionStr || solutionStr.trim() === '') {
      return {
        success: true,
        isAlreadySolved: true,
        moves: [],
        steps: [],
        stepCount: 0,
      };
    }

    const rawMoves = solutionStr.trim().split(/\s+/).filter(Boolean) as MoveName[];
    const steps: SolutionStep[] = rawMoves.map((m, idx) => ({
      stepNumber: idx + 1,
      move: m,
      notation: m,
      description: MOVE_DESCRIPTIONS[m] || `${m} 旋转`,
    }));

    return {
      success: true,
      isAlreadySolved: false,
      moves: rawMoves,
      steps,
      stepCount: rawMoves.length,
    };
  } catch (err: any) {
    return {
      success: false,
      error: '求解器解析异常：' + (err?.message || '请检查魔方配色合法性'),
      moves: [],
      steps: [],
      stepCount: 0,
    };
  }
}

export function generateRandomScramble3x3(length = 20): MoveName[] {
  const faces: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  const suffixes = ['', "'", '2'];
  const scramble: MoveName[] = [];
  let lastFace: string | null = null;
  let secondLastFace: string | null = null;

  for (let i = 0; i < length; i++) {
    const candidates = faces.filter((f) => {
      if (f === lastFace) return false;
      if (
        secondLastFace === f &&
        ((f === 'U' && lastFace === 'D') ||
          (f === 'D' && lastFace === 'U') ||
          (f === 'L' && lastFace === 'R') ||
          (f === 'R' && lastFace === 'L') ||
          (f === 'F' && lastFace === 'B') ||
          (f === 'B' && lastFace === 'F'))
      ) {
        return false;
      }
      return true;
    });

    const chosenFace = candidates[Math.floor(Math.random() * candidates.length)];
    const chosenSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const move = `${chosenFace}${chosenSuffix}` as MoveName;

    scramble.push(move);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return scramble;
}
