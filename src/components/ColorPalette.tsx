import React from 'react';
import { CubeColor, CubeType, COLOR_PALETTE } from '../types/cube';
import { CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface ColorPaletteProps {
  cubeType: CubeType;
  activeColor: CubeColor;
  onSelectColor: (color: CubeColor) => void;
  colorCounts?: Record<CubeColor, number>;
  validationMessage?: string;
  isValid: boolean;
  isSolved: boolean;
  onResetSolved: () => void;
  onRandomScramble: () => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  cubeType,
  activeColor,
  onSelectColor,
  colorCounts = { white: 4, yellow: 4, green: 4, blue: 4, orange: 4, red: 4 },
  validationMessage,
  isValid,
  isSolved,
  onResetSolved,
  onRandomScramble,
}) => {
  const targetCount = cubeType === '4x4' ? 16 : cubeType === '3x3' ? 9 : 4;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span>颜色笔刷 (点击选取后可在3D或展开图填色)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            id="btn-quick-scramble"
            onClick={onRandomScramble}
            title="随机打乱魔方"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            随机打乱
          </button>
          <button
            id="btn-quick-reset"
            onClick={onResetSolved}
            title="重置为已还原状态"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重置还原
          </button>
        </div>
      </div>

      {/* 6 Color swatches */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {COLOR_PALETTE.map(({ color, hex, name }) => {
          const count = colorCounts[color] ?? 0;
          const isSelected = activeColor === color;
          const isCountCorrect = count === targetCount;

          return (
            <button
              key={color}
              id={`color-swatch-${color}`}
              onClick={() => onSelectColor(color)}
              className={`relative flex flex-col items-center p-2 rounded-xl transition-all duration-150 border text-left ${
                isSelected
                  ? 'bg-slate-800 border-indigo-500 shadow-md ring-2 ring-indigo-500/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5 w-full">
                <span
                  className="w-4 h-4 rounded-full border border-black/20 shadow-sm shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs font-medium text-slate-200 truncate">
                  {name.split(' ')[0]}
                </span>
              </div>

              {/* Count badge */}
              <div className="w-full flex items-center justify-between">
                <span
                  className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    isCountCorrect
                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-900/60'
                      : count > targetCount
                      ? 'bg-rose-950/70 text-rose-400 border border-rose-900/60'
                      : 'bg-amber-950/70 text-amber-400 border border-amber-900/60'
                  }`}
                >
                  {count} / {targetCount}
                </span>
                {isSelected && (
                  <span className="text-[10px] text-indigo-400 font-medium">选中</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Validation status badge */}
      <div
        className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-relaxed ${
          isSolved
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            : isValid
            ? 'bg-sky-950/30 border-sky-800/60 text-sky-300'
            : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
        }`}
      >
        {isSolved ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        ) : isValid ? (
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          {isSolved
            ? '当前魔方已处于完全还原状态，可进行手动打乱或自定义配色。'
            : isValid
            ? '魔方状态合法，可直接点击右侧【自动解析】计算还原方案。'
            : validationMessage || '魔方配色不合法，请检查各面颜色数量或角块组合。'}
        </div>
      </div>
    </div>
  );
};
