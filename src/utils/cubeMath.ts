import { CubeColor, FaceletColors, FaceName, MoveName, CornerPieceState } from '../types/cube';

export interface CornerDefinition {
  id: number;
  name: string;
  colors: [CubeColor, CubeColor, CubeColor]; // [Primary(U/D), Secondary, Tertiary] in clockwise order
}

export const CORNERS: CornerDefinition[] = [
  { id: 0, name: 'UFL', colors: ['white', 'green', 'orange'] },
  { id: 1, name: 'UFR', colors: ['white', 'red', 'green'] },
  { id: 2, name: 'UBR', colors: ['white', 'blue', 'red'] },
  { id: 3, name: 'UBL', colors: ['white', 'orange', 'blue'] },
  { id: 4, name: 'DFL', colors: ['yellow', 'orange', 'green'] },
  { id: 5, name: 'DFR', colors: ['yellow', 'green', 'red'] },
  { id: 6, name: 'DBR', colors: ['yellow', 'red', 'blue'] },
  { id: 7, name: 'DBL', colors: ['yellow', 'blue', 'orange'] },
];

export interface CornerSlotFaceletRef {
  face: FaceName;
  index: number;
}

// For each corner position (0..7), the face and index for [Primary(U/D), Secondary, Tertiary]
export const CORNER_SLOTS: [CornerSlotFaceletRef, CornerSlotFaceletRef, CornerSlotFaceletRef][] = [
  // 0: UFL
  [{ face: 'U', index: 2 }, { face: 'F', index: 0 }, { face: 'L', index: 1 }],
  // 1: UFR
  [{ face: 'U', index: 3 }, { face: 'R', index: 0 }, { face: 'F', index: 1 }],
  // 2: UBR
  [{ face: 'U', index: 1 }, { face: 'B', index: 0 }, { face: 'R', index: 1 }],
  // 3: UBL
  [{ face: 'U', index: 0 }, { face: 'L', index: 0 }, { face: 'B', index: 1 }],
  // 4: DFL
  [{ face: 'D', index: 0 }, { face: 'L', index: 3 }, { face: 'F', index: 2 }],
  // 5: DFR
  [{ face: 'D', index: 1 }, { face: 'F', index: 3 }, { face: 'R', index: 2 }],
  // 6: DBR
  [{ face: 'D', index: 3 }, { face: 'R', index: 3 }, { face: 'B', index: 2 }],
  // 7: DBL
  [{ face: 'D', index: 2 }, { face: 'B', index: 3 }, { face: 'L', index: 2 }],
];

// Returns standard solved facelet colors
export function getSolvedFacelets(): FaceletColors {
  return {
    U: ['white', 'white', 'white', 'white'],
    D: ['yellow', 'yellow', 'yellow', 'yellow'],
    F: ['green', 'green', 'green', 'green'],
    B: ['blue', 'blue', 'blue', 'blue'],
    L: ['orange', 'orange', 'orange', 'orange'],
    R: ['red', 'red', 'red', 'red'],
  };
}

// Convert CornerPieceState to FaceletColors
export function cornerStateToFacelets(state: CornerPieceState): FaceletColors {
  const facelets = getSolvedFacelets();

  for (let slot = 0; slot < 8; slot++) {
    const pieceId = state.permutation[slot];
    const ori = state.orientation[slot];
    const piece = CORNERS[pieceId];
    const slotRefs = CORNER_SLOTS[slot];

    // piece.colors[0] is primary (white/yellow).
    // The sticker at slotRefs[ori] gets primary color.
    // The sticker at slotRefs[(ori+1)%3] gets secondary color.
    // The sticker at slotRefs[(ori+2)%3] gets tertiary color.
    const primaryColor = piece.colors[0];
    const secondaryColor = piece.colors[1];
    const tertiaryColor = piece.colors[2];

    facelets[slotRefs[ori].face][slotRefs[ori].index] = primaryColor;
    facelets[slotRefs[(ori + 1) % 3].face][slotRefs[(ori + 1) % 3].index] = secondaryColor;
    facelets[slotRefs[(ori + 2) % 3].face][slotRefs[(ori + 2) % 3].index] = tertiaryColor;
  }

  return facelets;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  colorCounts?: Record<CubeColor, number>;
  state?: CornerPieceState;
}

// Validates arbitrary facelet colors and extracts CornerPieceState
export function validateAndExtractState(facelets: FaceletColors): ValidationResult {
  const counts: Record<CubeColor, number> = {
    white: 0,
    yellow: 0,
    green: 0,
    blue: 0,
    orange: 0,
    red: 0,
  };

  const faces: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
  for (const face of faces) {
    for (let i = 0; i < 4; i++) {
      const c = facelets[face][i];
      if (c && counts[c] !== undefined) {
        counts[c]++;
      }
    }
  }

  // Check 4 of each color
  const colorNames: Record<CubeColor, string> = {
    white: '白色',
    yellow: '黄色',
    green: '绿色',
    blue: '蓝色',
    orange: '橙色',
    red: '红色',
  };

  for (const [col, cnt] of Object.entries(counts) as [CubeColor, number][]) {
    if (cnt !== 4) {
      return {
        valid: false,
        error: `${colorNames[col]}数量为 ${cnt} / 4 个（每个颜色必须正好为 4 个）`,
        colorCounts: counts,
      };
    }
  }

  const permutation = new Array<number>(8);
  const orientation = new Array<number>(8);
  const seenPieces = new Set<number>();

  for (let slot = 0; slot < 8; slot++) {
    const slotRefs = CORNER_SLOTS[slot];
    const rawColors: [CubeColor, CubeColor, CubeColor] = [
      facelets[slotRefs[0].face][slotRefs[0].index],
      facelets[slotRefs[1].face][slotRefs[1].index],
      facelets[slotRefs[2].face][slotRefs[2].index],
    ];

    // Check if White or Yellow is present
    const whiteYellowIdx = rawColors.findIndex((c) => c === 'white' || c === 'yellow');
    if (whiteYellowIdx === -1) {
      return {
        valid: false,
        error: `第 ${slot + 1} 个角块缺少白色或黄色面`,
        colorCounts: counts,
      };
    }

    // Check if both white and yellow exist in the same corner
    const hasWhite = rawColors.includes('white');
    const hasYellow = rawColors.includes('yellow');
    if (hasWhite && hasYellow) {
      return {
        valid: false,
        error: `第 ${slot + 1} 个角块同时包含相对的白色和黄色`,
        colorCounts: counts,
      };
    }

    const ori = whiteYellowIdx;
    const primary = rawColors[ori];
    const secondary = rawColors[(ori + 1) % 3];
    const tertiary = rawColors[(ori + 2) % 3];

    // Find which corner this matches
    const matchedCorner = CORNERS.find(
      (c) => c.colors[0] === primary && c.colors[1] === secondary && c.colors[2] === tertiary,
    );

    if (!matchedCorner) {
      return {
        valid: false,
        error: `第 ${slot + 1} 个角块颜色组合 [${colorNames[primary]}, ${colorNames[secondary]}, ${colorNames[tertiary]}] 非法或左右镜像，无法拼成正常魔方`,
        colorCounts: counts,
      };
    }

    if (seenPieces.has(matchedCorner.id)) {
      return {
        valid: false,
        error: `存在重复的角块：${matchedCorner.name} (${colorNames[matchedCorner.colors[0]]}+${colorNames[matchedCorner.colors[1]]}+${colorNames[matchedCorner.colors[2]]})`,
        colorCounts: counts,
      };
    }

    seenPieces.add(matchedCorner.id);
    permutation[slot] = matchedCorner.id;
    orientation[slot] = ori;
  }

  // Check orientation sum parity (must be multiple of 3)
  const oriSum = orientation.reduce((acc, val) => acc + val, 0);
  if (oriSum % 3 !== 0) {
    return {
      valid: false,
      error: `魔方角块朝向总和异常（模3余数不为0），角块可能被单独翻转过`,
      colorCounts: counts,
    };
  }

  // Check permutation parity (corner permutation parity must match)
  let inversions = 0;
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      if (permutation[i] > permutation[j]) inversions++;
    }
  }
  // In a 2x2 cube, since orientation is free, every permutation parity is solvable because whole cube rotations
  // have odd parity! So any orientation sum % 3 == 0 with 8 distinct corners is solvable!

  return {
    valid: true,
    colorCounts: counts,
    state: { permutation, orientation },
  };
}

// Move definitions:
export interface MoveTransition {
  cycle: [number, number, number, number]; // 4-cycle of positions: [A, B, C, D] meaning A->B->C->D->A
  ori: [number, number, number, number];
}

// For 90 degree clockwise rotation of each face:
export const FACE_MOVES_CW: Record<FaceName, MoveTransition> = {
  U: {
    cycle: [0, 3, 2, 1],
    ori: [0, 0, 0, 0],
  },
  D: {
    cycle: [4, 5, 6, 7],
    ori: [0, 0, 0, 0],
  },
  F: {
    cycle: [0, 1, 5, 4],
    ori: [1, 2, 1, 2],
  },
  B: {
    cycle: [2, 3, 7, 6],
    ori: [1, 2, 1, 2],
  },
  L: {
    cycle: [0, 4, 7, 3],
    ori: [2, 1, 2, 1],
  },
  R: {
    cycle: [1, 2, 6, 5],
    ori: [1, 2, 1, 2],
  },
};

// Apply 1 turn of a face to CornerPieceState
export function applyFaceTurnCW(state: CornerPieceState, face: FaceName): CornerPieceState {
  const { cycle, ori } = FACE_MOVES_CW[face];
  const nextP = [...state.permutation];
  const nextO = [...state.orientation];

  for (let i = 0; i < 4; i++) {
    const fromSlot = cycle[i];
    const toSlot = cycle[(i + 1) % 4];
    const dO = ori[i];
    nextP[toSlot] = state.permutation[fromSlot];
    nextO[toSlot] = (state.orientation[fromSlot] + dO) % 3;
  }

  return { permutation: nextP, orientation: nextO };
}

// Apply arbitrary MoveName to state
export function applyMoveToState(state: CornerPieceState, move: MoveName): CornerPieceState {
  const face = move[0] as FaceName;
  const isPrime = move.includes("'");
  const isDouble = move.includes('2');

  if (isDouble) {
    return applyFaceTurnCW(applyFaceTurnCW(state, face), face);
  } else if (isPrime) {
    return applyFaceTurnCW(applyFaceTurnCW(applyFaceTurnCW(state, face), face), face);
  } else {
    return applyFaceTurnCW(state, face);
  }
}

function cloneFacelets(f: FaceletColors): FaceletColors {
  return {
    U: [...f.U] as [CubeColor, CubeColor, CubeColor, CubeColor],
    D: [...f.D] as [CubeColor, CubeColor, CubeColor, CubeColor],
    F: [...f.F] as [CubeColor, CubeColor, CubeColor, CubeColor],
    B: [...f.B] as [CubeColor, CubeColor, CubeColor, CubeColor],
    L: [...f.L] as [CubeColor, CubeColor, CubeColor, CubeColor],
    R: [...f.R] as [CubeColor, CubeColor, CubeColor, CubeColor],
  };
}

function cycle4(
  f: FaceletColors,
  [f0, i0]: [FaceName, number],
  [f1, i1]: [FaceName, number],
  [f2, i2]: [FaceName, number],
  [f3, i3]: [FaceName, number],
) {
  const temp = f[f3][i3];
  f[f3][i3] = f[f2][i2];
  f[f2][i2] = f[f1][i1];
  f[f1][i1] = f[f0][i0];
  f[f0][i0] = temp;
}

// Directly rotate facelet colors for 90° clockwise turn on a face
export function applyFaceTurnFaceletsCW(facelets: FaceletColors, face: FaceName): FaceletColors {
  const next = cloneFacelets(facelets);
  switch (face) {
    case 'U':
      cycle4(next, ['U', 0], ['U', 1], ['U', 3], ['U', 2]);
      cycle4(next, ['F', 0], ['L', 0], ['B', 0], ['R', 0]);
      cycle4(next, ['F', 1], ['L', 1], ['B', 1], ['R', 1]);
      break;
    case 'D':
      cycle4(next, ['D', 0], ['D', 1], ['D', 3], ['D', 2]);
      cycle4(next, ['F', 2], ['R', 2], ['B', 2], ['L', 2]);
      cycle4(next, ['F', 3], ['R', 3], ['B', 3], ['L', 3]);
      break;
    case 'F':
      cycle4(next, ['U', 2], ['R', 0], ['D', 1], ['L', 3]);
      cycle4(next, ['U', 3], ['R', 2], ['D', 0], ['L', 1]);
      cycle4(next, ['F', 0], ['F', 1], ['F', 3], ['F', 2]);
      break;
    case 'B':
      cycle4(next, ['U', 0], ['L', 2], ['D', 3], ['R', 1]);
      cycle4(next, ['U', 1], ['L', 0], ['D', 2], ['R', 3]);
      cycle4(next, ['B', 0], ['B', 1], ['B', 3], ['B', 2]);
      break;
    case 'L':
      cycle4(next, ['U', 0], ['F', 0], ['D', 0], ['B', 3]);
      cycle4(next, ['U', 2], ['F', 2], ['D', 2], ['B', 1]);
      cycle4(next, ['L', 0], ['L', 1], ['L', 3], ['L', 2]);
      break;
    case 'R':
      cycle4(next, ['U', 1], ['B', 2], ['D', 1], ['F', 1]);
      cycle4(next, ['U', 3], ['B', 0], ['D', 3], ['F', 3]);
      cycle4(next, ['R', 0], ['R', 1], ['R', 3], ['R', 2]);
      break;
  }
  return next;
}

// Apply move directly to facelets
export function applyMoveToFacelets(facelets: FaceletColors, move: MoveName): FaceletColors {
  const face = move[0] as FaceName;
  const isPrime = move.includes("'");
  const isDouble = move.includes('2');

  if (isDouble) {
    return applyFaceTurnFaceletsCW(applyFaceTurnFaceletsCW(facelets, face), face);
  } else if (isPrime) {
    return applyFaceTurnFaceletsCW(
      applyFaceTurnFaceletsCW(applyFaceTurnFaceletsCW(facelets, face), face),
      face,
    );
  } else {
    return applyFaceTurnFaceletsCW(facelets, face);
  }
}

// Inverse of a move
export function getInverseMove(move: MoveName): MoveName {
  if (move.endsWith('2')) return move;
  if (move.endsWith("'")) return move.slice(0, 1) as MoveName;
  return `${move}'` as MoveName;
}

// Chinese descriptions for moves
export const MOVE_DESCRIPTIONS: Record<MoveName, string> = {
  U: '顶层顺时针旋转 90°',
  "U'": '顶层逆时针旋转 90°',
  U2: '顶层旋转 180°',
  D: '底层顺时针旋转 90°',
  "D'": '底层逆时针旋转 90°',
  D2: '底层旋转 180°',
  F: '前层顺时针旋转 90°',
  "F'": '前层逆时针旋转 90°',
  F2: '前层旋转 180°',
  B: '后层顺时针旋转 90°',
  "B'": '后层逆时针旋转 90°',
  B2: '后层旋转 180°',
  L: '左层顺时针旋转 90°',
  "L'": '左层逆时针旋转 90°',
  L2: '左层旋转 180°',
  R: '右层顺时针旋转 90°',
  "R'": '右层逆时针旋转 90°',
  R2: '右层旋转 180°',
};
