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
  | 'R' | "R'" | 'R2'
  | 'Uw' | "Uw'" | 'Uw2'
  | 'Dw' | "Dw'" | 'Dw2'
  | 'Fw' | "Fw'" | 'Fw2'
  | 'Bw' | "Bw'" | 'Bw2'
  | 'Lw' | "Lw'" | 'Lw2'
  | 'Rw' | "Rw'" | 'Rw2'
  | '2U' | "2U'" | '2U2'
  | '2D' | "2D'" | '2D2'
  | '2F' | "2F'" | '2F2'
  | '2B' | "2B'" | '2B2'
  | '2L' | "2L'" | '2L2'
  | '2R' | "2R'" | '2R2';

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
  phase?: string;
}

export type CubeType = '2x2' | '3x3' | '4x4';

// Facelet colors for each of the 6 faces.
// For 2x2: array length 4
// For 3x3: array length 9
export type FaceletColors = Record<FaceName, CubeColor[]>;

// Physical corner piece state
export interface CornerPieceState {
  permutation: number[]; // length 8, each element is piece id 0..7
  orientation: number[]; // length 8, each element is 0, 1, or 2
}
