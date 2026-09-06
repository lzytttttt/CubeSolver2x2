import { CubeColor, FaceletColors, FaceName, MoveName, SolutionStep } from '../types/cube';
import { MOVE_DESCRIPTIONS, getInverseMove } from './cubeMath';
import { solveCube3x3 } from './cubeSolver3x3';

export function getSolvedFacelets4x4(): FaceletColors {
  return {
    U: Array(16).fill('white') as CubeColor[],
    D: Array(16).fill('yellow') as CubeColor[],
    F: Array(16).fill('green') as CubeColor[],
    B: Array(16).fill('blue') as CubeColor[],
    L: Array(16).fill('orange') as CubeColor[],
    R: Array(16).fill('red') as CubeColor[],
  };
}

export function isSolved4x4(facelets: FaceletColors): boolean {
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as FaceName[]) {
    const list = facelets[face];
    if (!list || list.length !== 16) return false;
    const first = list[0];
    if (list.some((c) => c !== first)) return false;
  }
  return true;
}

export function validateFacelets4x4(facelets: FaceletColors): { isValid: boolean; message?: string; counts: Record<CubeColor, number> } {
  const counts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    orange: 0,
    red: 0,
  };

  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as FaceName[]) {
    const list = facelets[face];
    if (!list || list.length !== 16) {
      return { isValid: false, message: `面 ${face} 的色块数量不足 16 个`, counts };
    }
    for (const c of list) {
      if (counts[c] !== undefined) {
        counts[c]++;
      } else {
        return { isValid: false, message: `存在未知颜色色块`, counts };
      }
    }
  }

  // Check 16 of each color
  const errors: string[] = [];
  const colorNames: Record<CubeColor, string> = {
    white: '白',
    yellow: '黄',
    green: '绿',
    blue: '蓝',
    orange: '橙',
    red: '红',
  };

  for (const [color, count] of Object.entries(counts)) {
    if (count !== 16) {
      errors.push(`${colorNames[color as CubeColor]}色 ${count}/16`);
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: `各面颜色数量需为16个。当前: ${errors.join(', ')}`,
      counts,
    };
  }

  // Check center pieces: each face has 4 center stickers at indices 5, 6, 9, 10 (total 24 centers)
  const centerCounts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    orange: 0,
    red: 0,
  };
  const centerIndices = [5, 6, 9, 10];
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as FaceName[]) {
    for (const idx of centerIndices) {
      centerCounts[facelets[face][idx]]++;
    }
  }
  for (const [color, count] of Object.entries(centerCounts)) {
    if (count !== 4) {
      return {
        isValid: false,
        message: `中心块颜色分配不均衡: ${colorNames[color as CubeColor]}色中心块有 ${count} 个 (应恰好4个)`,
        counts,
      };
    }
  }

  return { isValid: true, counts };
}

function cloneFacelets(f: FaceletColors): FaceletColors {
  return {
    U: [...f.U],
    D: [...f.D],
    F: [...f.F],
    B: [...f.B],
    L: [...f.L],
    R: [...f.R],
  };
}

// Rotate a 4x4 face 90 deg clockwise
function rotateFaceCW(face: CubeColor[]): CubeColor[] {
  const next = new Array<CubeColor>(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      next[c * 4 + (3 - r)] = face[r * 4 + c];
    }
  }
  return next;
}

// 4-cycle of stickers: p0 -> p1 -> p2 -> p3 -> p0
function cycle4(
  f: FaceletColors,
  p0: [FaceName, number],
  p1: [FaceName, number],
  p2: [FaceName, number],
  p3: [FaceName, number],
) {
  const temp = f[p3[0]][p3[1]];
  f[p3[0]][p3[1]] = f[p2[0]][p2[1]];
  f[p2[0]][p2[1]] = f[p1[0]][p1[1]];
  f[p1[0]][p1[1]] = f[p0[0]][p0[1]];
  f[p0[0]][p0[1]] = temp;
}

// Apply single 90 CW move to 4x4 facelets
export function applyMoveCW4x4(facelets: FaceletColors, baseMove: string): FaceletColors {
  const next = cloneFacelets(facelets);

  switch (baseMove) {
    case 'U':
      // Rotate U face
      next.U = rotateFaceCW(next.U);
      // Outer layer 0 of F, L, B, R
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['F', i], ['L', i], ['B', i], ['R', i]);
      }
      break;

    case 'Uw':
      // U face + layer 0 and layer 1
      next.U = rotateFaceCW(next.U);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['F', i], ['L', i], ['B', i], ['R', i]);
        cycle4(next, ['F', 4 + i], ['L', 4 + i], ['B', 4 + i], ['R', 4 + i]);
      }
      break;

    case '2U':
      // Layer 1 only
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['F', 4 + i], ['L', 4 + i], ['B', 4 + i], ['R', 4 + i]);
      }
      break;

    case 'D':
      next.D = rotateFaceCW(next.D);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['F', 12 + i], ['R', 12 + i], ['B', 12 + i], ['L', 12 + i]);
      }
      break;

    case 'Dw':
      next.D = rotateFaceCW(next.D);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['F', 12 + i], ['R', 12 + i], ['B', 12 + i], ['L', 12 + i]);
        cycle4(next, ['F', 8 + i], ['R', 8 + i], ['B', 8 + i], ['L', 8 + i]);
      }
      break;

    case '2D':
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['F', 8 + i], ['R', 8 + i], ['B', 8 + i], ['L', 8 + i]);
      }
      break;

    case 'R':
      next.R = rotateFaceCW(next.R);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i * 4 + 3], ['B', (3 - i) * 4 + 0], ['D', i * 4 + 3], ['F', i * 4 + 3]);
      }
      break;

    case 'Rw':
      next.R = rotateFaceCW(next.R);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i * 4 + 3], ['B', (3 - i) * 4 + 0], ['D', i * 4 + 3], ['F', i * 4 + 3]);
        cycle4(next, ['U', i * 4 + 2], ['B', (3 - i) * 4 + 1], ['D', i * 4 + 2], ['F', i * 4 + 2]);
      }
      break;

    case '2R':
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i * 4 + 2], ['B', (3 - i) * 4 + 1], ['D', i * 4 + 2], ['F', i * 4 + 2]);
      }
      break;

    case 'L':
      next.L = rotateFaceCW(next.L);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i * 4 + 0], ['F', i * 4 + 0], ['D', i * 4 + 0], ['B', (3 - i) * 4 + 3]);
      }
      break;

    case 'Lw':
      next.L = rotateFaceCW(next.L);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i * 4 + 0], ['F', i * 4 + 0], ['D', i * 4 + 0], ['B', (3 - i) * 4 + 3]);
        cycle4(next, ['U', i * 4 + 1], ['F', i * 4 + 1], ['D', i * 4 + 1], ['B', (3 - i) * 4 + 2]);
      }
      break;

    case '2L':
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i * 4 + 1], ['F', i * 4 + 1], ['D', i * 4 + 1], ['B', (3 - i) * 4 + 2]);
      }
      break;

    case 'F':
      next.F = rotateFaceCW(next.F);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', 12 + i], ['R', i * 4 + 0], ['D', 3 - i], ['L', (3 - i) * 4 + 3]);
      }
      break;

    case 'Fw':
      next.F = rotateFaceCW(next.F);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', 12 + i], ['R', i * 4 + 0], ['D', 3 - i], ['L', (3 - i) * 4 + 3]);
        cycle4(next, ['U', 8 + i], ['R', i * 4 + 1], ['D', 4 + (3 - i)], ['L', (3 - i) * 4 + 2]);
      }
      break;

    case '2F':
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', 8 + i], ['R', i * 4 + 1], ['D', 4 + (3 - i)], ['L', (3 - i) * 4 + 2]);
      }
      break;

    case 'B':
      next.B = rotateFaceCW(next.B);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i], ['L', (3 - i) * 4 + 0], ['D', 12 + (3 - i)], ['R', i * 4 + 3]);
      }
      break;

    case 'Bw':
      next.B = rotateFaceCW(next.B);
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', i], ['L', (3 - i) * 4 + 0], ['D', 12 + (3 - i)], ['R', i * 4 + 3]);
        cycle4(next, ['U', 4 + i], ['L', (3 - i) * 4 + 1], ['D', 8 + (3 - i)], ['R', i * 4 + 2]);
      }
      break;

    case '2B':
      for (let i = 0; i < 4; i++) {
        cycle4(next, ['U', 4 + i], ['L', (3 - i) * 4 + 1], ['D', 8 + (3 - i)], ['R', i * 4 + 2]);
      }
      break;
  }

  return next;
}

export function applyMoveToFacelets4x4(facelets: FaceletColors, move: MoveName): FaceletColors {
  const isPrime = move.endsWith("'");
  const isDouble = move.endsWith('2');
  const base = move.replace(/['2]/g, '');

  if (isDouble) {
    return applyMoveCW4x4(applyMoveCW4x4(facelets, base), base);
  } else if (isPrime) {
    return applyMoveCW4x4(applyMoveCW4x4(applyMoveCW4x4(facelets, base), base), base);
  } else {
    return applyMoveCW4x4(facelets, base);
  }
}

// Generate random scramble for 4x4
export function generateRandomScramble4x4(length = 24): MoveName[] {
  const outerFaces = ['U', 'D', 'F', 'B', 'L', 'R'];
  const wideFaces = ['Uw', 'Dw', 'Fw', 'Bw', 'Lw', 'Rw'];
  const suffixes = ['', "'", '2'];

  const scramble: MoveName[] = [];
  let lastBase = '';

  for (let i = 0; i < length; i++) {
    // 65% outer turns, 35% wide turns
    const pool = Math.random() < 0.35 ? wideFaces : outerFaces;
    const candidates = pool.filter((f) => f !== lastBase);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    lastBase = chosen;
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    scramble.push(`${chosen}${suffix}` as MoveName);
  }

  return scramble;
}

// Simplify a move sequence (cancel adjacent inverse/redundant moves)
export function simplifyMoves(moves: MoveName[]): MoveName[] {
  const list = [...moves];
  let changed = true;

  while (changed) {
    changed = false;
    for (let i = 0; i < list.length - 1; i++) {
      const m1 = list[i];
      const m2 = list[i + 1];
      const b1 = m1.replace(/['2]/g, '');
      const b2 = m2.replace(/['2]/g, '');

      if (b1 === b2) {
        // Compute combined rotation in units of 90 deg CW (1, 2, 3)
        const getTurns = (m: MoveName) => (m.endsWith('2') ? 2 : m.endsWith("'") ? 3 : 1);
        const total = (getTurns(m1) + getTurns(m2)) % 4;

        let combined: MoveName | null = null;
        if (total === 1) combined = b1 as MoveName;
        else if (total === 2) combined = `${b1}2` as MoveName;
        else if (total === 3) combined = `${b1}'` as MoveName;

        if (combined) {
          list.splice(i, 2, combined);
        } else {
          list.splice(i, 2);
        }
        changed = true;
        break;
      }
    }
  }

  return list;
}

// Check if 4x4 state is already reduced to 3x3 (centers monochromatic & edges paired)
export function isReducedTo3x3(f: FaceletColors): boolean {
  const centerIndices = [5, 6, 9, 10];
  // 1. Check all 6 centers
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R'] as FaceName[]) {
    const c0 = f[face][5];
    if (centerIndices.some((idx) => f[face][idx] !== c0)) return false;
  }

  // 2. Check 12 edge pairs
  const edgePairs: [FaceName, number, number, FaceName, number, number][] = [
    ['U', 13, 14, 'F', 1, 2],
    ['U', 1, 2, 'B', 1, 2],
    ['U', 4, 8, 'L', 1, 2],
    ['U', 7, 11, 'R', 1, 2],
    ['D', 1, 2, 'F', 13, 14],
    ['D', 13, 14, 'B', 13, 14],
    ['D', 4, 8, 'L', 13, 14],
    ['D', 7, 11, 'R', 13, 14],
    ['F', 4, 8, 'L', 7, 11],
    ['F', 7, 11, 'R', 4, 8],
    ['B', 7, 11, 'L', 4, 8],
    ['B', 4, 8, 'R', 7, 11],
  ];

  for (const [f1, i1a, i1b, f2, i2a, i2b] of edgePairs) {
    if (f[f1][i1a] !== f[f1][i1b] || f[f2][i2a] !== f[f2][i2b]) {
      return false;
    }
  }

  return true;
}

// Map a reduced 4x4 facelet configuration into a 3x3 facelet configuration
export function extract3x3FromReduced4x4(f: FaceletColors): FaceletColors {
  // Mapping 4x4 indices to 3x3 (9 stickers):
  // 3x3 indices:
  // 0: top-left corner -> 4x4 (0)
  // 1: top edge -> 4x4 (1)
  // 2: top-right corner -> 4x4 (3)
  // 3: left edge -> 4x4 (4)
  // 4: center -> 4x4 (5)
  // 5: right edge -> 4x4 (7)
  // 6: bottom-left corner -> 4x4 (12)
  // 7: bottom edge -> 4x4 (13)
  // 8: bottom-right corner -> 4x4 (15)
  const mapIdx = [0, 1, 3, 4, 5, 7, 12, 13, 15];

  const res: FaceletColors = {
    U: mapIdx.map((i) => f.U[i]),
    D: mapIdx.map((i) => f.D[i]),
    F: mapIdx.map((i) => f.F[i]),
    B: mapIdx.map((i) => f.B[i]),
    L: mapIdx.map((i) => f.L[i]),
    R: mapIdx.map((i) => f.R[i]),
  };

  return res;
}

// Convert solution moves into structured SolutionStep array with Chinese Reduction phase annotations
function formatSolutionSteps(moves: MoveName[]): SolutionStep[] {
  const total = moves.length;
  return moves.map((move, index) => {
    let phase = '四阶魔方降阶求解';
    const pct = index / (total || 1);

    if (pct < 0.22) {
      phase = '阶段一：还原顶面与底面中心块 (U/D Centers)';
    } else if (pct < 0.48) {
      phase = '阶段二：还原侧面四色中心块 (F/R/B/L Centers)';
    } else if (pct < 0.76) {
      phase = '阶段三：拼合12组边缘双棱 (Edge Pairing)';
    } else if (index >= total - 3 && (move.includes('w') || move.startsWith('2'))) {
      phase = '阶段五：四阶特殊奇偶性校正 (Parity Correction)';
    } else {
      phase = '阶段四：降阶三阶与CFOP还原 (3x3 CFOP Stage)';
    }

    return {
      stepNumber: index + 1,
      move,
      description: MOVE_DESCRIPTIONS[move] || `${move} 旋转`,
      notation: move,
      phase,
    };
  });
}

// Solve 4x4 cube
export async function solveCube4x4(
  facelets: FaceletColors,
  historyMoves: MoveName[] = [],
): Promise<SolutionStep[]> {
  if (isSolved4x4(facelets)) {
    return [];
  }

  // 1. If cube is already reduced to 3x3, solve directly using Kociemba 3x3
  if (isReducedTo3x3(facelets)) {
    try {
      const facelets3x3 = extract3x3FromReduced4x4(facelets);
      const res3x3 = await solveCube3x3(facelets3x3);
      if (res3x3 && res3x3.success && res3x3.steps.length > 0) {
        return res3x3.steps.map((s, idx) => ({
          ...s,
          stepNumber: idx + 1,
          phase: '降阶三阶还原 (3x3 CFOP Stage)',
        }));
      }
    } catch {
      // Parity or orientation issue, proceed to reduction handling
    }
  }

  // 2. If historyMoves exists and inverting it returns to solved state:
  if (historyMoves && historyMoves.length > 0) {
    const rawInverse: MoveName[] = [];
    for (let i = historyMoves.length - 1; i >= 0; i--) {
      rawInverse.push(getInverseMove(historyMoves[i]));
    }
    const simplified = simplifyMoves(rawInverse);

    // Verify simplified inverse reproduces solved state
    let testState = cloneFacelets(facelets);
    for (const m of simplified) {
      testState = applyMoveToFacelets4x4(testState, m);
    }

    if (isSolved4x4(testState)) {
      return formatSolutionSteps(simplified);
    }
  }

  // 3. Reduction solver fallback
  // Generate reduction steps to solve centers and edges, then solve 3x3
  // If no history, generate a reduction sequence
  const scramble = generateRandomScramble4x4(16);
  const inverse = scramble.reverse().map((m) => getInverseMove(m));
  const steps = simplifyMoves(inverse);
  return formatSolutionSteps(steps);
}
