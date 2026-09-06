export type FaceName = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export type CubeColor = 'white' | 'yellow' | 'green' | 'blue' | 'orange' | 'red';

export interface FaceColorConfig {
  name: FaceName;
  label: string;
  defaultColor: CubeColor;
  hex: string;
}

export const FACE_CONFIGS: Record<FaceName, FaceColorConfig> = {
  U: { name: 'U', label: '顶面 (Up / 白)', defaultColor: 'white', hex: '#FFFFFF' },
  D: { name: 'D', label: '底面 (Down / 黄)', defaultColor: 'yellow', hex: '#FECC00' },
  F: { name: 'F', label: '前面 (Front / 绿)', defaultColor: 'green', hex: '#009B48' },
  B: { name: 'B', label: '后面 (Back / 蓝)', defaultColor: 'blue', hex: '#0046AD' },
  L: { name: 'L', label: '左面 (Left / 橙)', defaultColor: 'orange', hex: '#FF5800' },
  R: { name: 'R', label: '右面 (Right / 红)', defaultColor: 'red', hex: '#B71234' },
};

export const COLOR_PALETTE: { color: CubeColor; hex: string; name: string }[] = [
  { color: 'white', hex: '#FFFFFF', name: '白色 (U)' },
  { color: 'yellow', hex: '#FECC00', name: '黄色 (D)' },
  { color: 'green', hex: '#009B48', name: '绿色 (F)' },
  { color: 'blue', hex: '#0046AD', name: '蓝色 (B)' },
  { color: 'orange', hex: '#FF5800', name: '橙色 (L)' },
  { color: 'red', hex: '#B71234', name: '红色 (R)' },
];

export type MoveName =
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2'
  | 'L' | "L'" | 'L2'
  | 'R' | "R'" | 'R2';

export interface MoveInfo {
  move: MoveName;
  face: FaceName;
  turns: 1 | -1 | 2; // 1 = 90 deg CW, -1 = 90 deg CCW, 2 = 180 deg
  description: string;
  axis: 'x' | 'y' | 'z';
  direction: number; // For 3D layer animation
}

export interface SolutionStep {
  stepNumber: number;
  move: MoveName;
  description: string;
  notation: string;
}

// 24 facelets: 6 faces * 4 stickers
// Indexing:
// U: 0, 1, 2, 3
// D: 4, 5, 6, 7
// F: 8, 9, 10, 11
// B: 12, 13, 14, 15
// L: 16, 17, 18, 19
// R: 20, 21, 22, 23
export type FaceletColors = Record<FaceName, [CubeColor, CubeColor, CubeColor, CubeColor]>;

// Physical corner piece state
export interface CornerPieceState {
  permutation: number[]; // length 8, each element is piece id 0..7
  orientation: number[]; // length 8, each element is 0, 1, or 2
}
