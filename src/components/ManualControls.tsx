import React, { useState } from 'react';
import { CubeType, FaceName, MoveName } from '../types/cube';
import { Play, Sparkles, RotateCw, History } from 'lucide-react';

interface ManualControlsProps {
  cubeType?: CubeType;
  onApplyMove: (move: MoveName) => void;
  onAutoSolve: () => void;
  onRandomScramble: () => void;
  isSolving: boolean;
  isValid: boolean;
  isSolved: boolean;
  isAnimating: boolean;
  recentMoves: MoveName[];
  onClearHistory: () => void;
}

interface FaceMoveGroup {
  face: FaceName;
  name: string;
  colorDot: string;
  moves: MoveName[];
}

const MOVE_GROUPS: FaceMoveGroup[] = [
  { face: 'U', name: '顶层 U', colorDot: 'bg-white', moves: ['U', "U'", 'U2'] },
  { face: 'D', name: '底层 D', colorDot: 'bg-amber-400', moves: ['D', "D'", 'D2'] },
  { face: 'F', name: '前层 F', colorDot: 'bg-emerald-500', moves: ['F', "F'", 'F2'] },
  { face: 'B', name: '后层 B', colorDot: 'bg-blue-600', moves: ['B', "B'", 'B2'] },
  { face: 'L', name: '左层 L', colorDot: 'bg-orange-500', moves: ['L', "L'", 'L2'] },
  { face: 'R', name: '右层 R', colorDot: 'bg-rose-600', moves: ['R', "R'", 'R2'] },
];

const WIDE_MOVE_GROUPS: FaceMoveGroup[] = [
  { face: 'U', name: '顶双层 Uw', colorDot: 'bg-white', moves: ['Uw', "Uw'", 'Uw2'] },
  { face: 'D', name: '底双层 Dw', colorDot: 'bg-amber-400', moves: ['Dw', "Dw'", 'Dw2'] },
  { face: 'F', name: '前双层 Fw', colorDot: 'bg-emerald-500', moves: ['Fw', "Fw'", 'Fw2'] },
  { face: 'B', name: '后双层 Bw', colorDot: 'bg-blue-600', moves: ['Bw', "Bw'", 'Bw2'] },
  { face: 'L', name: '左双层 Lw', colorDot: 'bg-orange-500', moves: ['Lw', "Lw'", 'Lw2'] },
  { face: 'R', name: '右双层 Rw', colorDot: 'bg-rose-600', moves: ['Rw', "Rw'", 'Rw2'] },
];

const SLICE_MOVE_GROUPS: FaceMoveGroup[] = [
  { face: 'U', name: '顶内切 2U', colorDot: 'bg-white', moves: ['2U', "2U'", '2U2'] },
  { face: 'D', name: '底内切 2D', colorDot: 'bg-amber-400', moves: ['2D', "2D'", '2D2'] },
  { face: 'F', name: '前内切 2F', colorDot: 'bg-emerald-500', moves: ['2F', "2F'", '2F2'] },
  { face: 'B', name: '后内切 2B', colorDot: 'bg-blue-600', moves: ['2B', "2B'", '2B2'] },
  { face: 'L', name: '左内切 2L', colorDot: 'bg-orange-500', moves: ['2L', "2L'", '2L2'] },
  { face: 'R', name: '右内切 2R', colorDot: 'bg-rose-600', moves: ['2R', "2R'", '2R2'] },
];

export const ManualControls: React.FC<ManualControlsProps> = ({
  cubeType = '2x2',
  onApplyMove,
  onAutoSolve,
  onRandomScramble,
  isSolving,
  isValid,
  isSolved,
  isAnimating,
  recentMoves,
  onClearHistory,
}) => {
  const [moveSubCategory, setMoveSubCategory] = useState<'outer' | 'wide' | 'slice'>('outer');

  const activeGroups =
    cubeType === '4x4'
      ? moveSubCategory === 'wide'
        ? WIDE_MOVE_GROUPS
        : moveSubCategory === 'slice'
        ? SLICE_MOVE_GROUPS
        : MOVE_GROUPS
      : MOVE_GROUPS;
  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur">
      {/* Primary Action Button: Auto Solve */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          id="btn-auto-solve"
          onClick={onAutoSolve}
          disabled={!isValid || isSolved || isSolving || isAnimating}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 ${
            isSolved
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 cursor-default'
              : !isValid
              ? 'bg-slate-800/60 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-indigo-900/30'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {isSolved
              ? '当前已完全还原'
              : isSolving
              ? '正在计算最优解法...'
              : '一键自动解析 (生成还原步骤)'}
          </span>
        </button>

        <button
          id="btn-manual-scramble"
          onClick={onRandomScramble}
          disabled={isAnimating || isSolving}
          className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
        >
          <RotateCw className="w-4 h-4" />
          <span>随机打乱</span>
        </button>
      </div>

      {/* Manual Move Keypad */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>手动旋转魔方层 (带3D平滑动画)</span>
          <span className="text-[11px] font-normal text-slate-500">点击即转</span>
        </div>

        {cubeType === '4x4' && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-2.5">
            <button
              onClick={() => setMoveSubCategory('outer')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                moveSubCategory === 'outer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              外层单转 (U/D/F/B/L/R)
            </button>
            <button
              onClick={() => setMoveSubCategory('wide')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                moveSubCategory === 'wide'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              宽层双转 (Uw/Dw...)
            </button>
            <button
              onClick={() => setMoveSubCategory('slice')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                moveSubCategory === 'slice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              内切层单转 (2U/2D...)
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activeGroups.map((group) => (
            <div
              key={group.face}
              className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-1.5 px-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${group.colorDot}`} />
                <span className="text-xs font-medium text-slate-300">
                  {group.name}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {group.moves.map((move) => (
                  <button
                    key={move}
                    id={`btn-move-${move.replace("'", '_prime')}`}
                    onClick={() => onApplyMove(move)}
                    disabled={isAnimating}
                    className="py-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600/80 active:bg-indigo-700 text-slate-200 hover:text-white font-mono text-xs font-bold border border-slate-800 hover:border-indigo-500/50 transition-all disabled:opacity-40"
                  >
                    {move}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Move History / Custom Scramble Sequence */}
      {recentMoves.length > 0 && (
        <div className="pt-1 border-t border-slate-800/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>打乱/操作记录 ({recentMoves.length} 步):</span>
            </div>
            <button
              onClick={onClearHistory}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              清除记录
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
            {recentMoves.map((m, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700/60"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
