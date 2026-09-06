import React from 'react';
import { CubeColor, FaceletColors, FaceName, FACE_CONFIGS } from '../types/cube';

interface CubeNet2DProps {
  facelets: FaceletColors;
  onStickerClick: (face: FaceName, index: number) => void;
  activeColor: CubeColor;
}

const COLOR_BG: Record<CubeColor, string> = {
  white: 'bg-white border-slate-300 text-slate-800',
  yellow: 'bg-amber-400 border-amber-500 text-amber-950',
  green: 'bg-emerald-600 border-emerald-700 text-white',
  blue: 'bg-blue-600 border-blue-700 text-white',
  orange: 'bg-orange-500 border-orange-600 text-white',
  red: 'bg-rose-600 border-rose-700 text-white',
};

export const CubeNet2D: React.FC<CubeNet2DProps> = ({
  facelets,
  onStickerClick,
  activeColor,
}) => {
  const renderFace = (face: FaceName) => {
    const config = FACE_CONFIGS[face];
    const stickers = facelets[face];

    return (
      <div className="flex flex-col items-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 shadow-inner">
        <div className="text-[11px] font-semibold text-slate-400 mb-1 tracking-tight">
          {config.name} ({config.label.split(' ')[0]})
        </div>
        <div className="grid grid-cols-2 gap-1 w-16 h-16 sm:w-20 sm:h-20">
          {stickers.map((col, idx) => (
            <button
              key={`${face}-${idx}`}
              id={`facelet-${face}-${idx}`}
              onClick={() => onStickerClick(face, idx)}
              title={`点击设定此块为 ${activeColor} 或切换颜色`}
              className={`rounded-md border-2 transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-sm flex items-center justify-center font-mono text-[10px] ${COLOR_BG[col]}`}
            >
              <span className="opacity-0 hover:opacity-75 select-none font-bold">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center select-none py-1">
      {/* Top row: U */}
      <div className="flex justify-center mb-1">
        {renderFace('U')}
      </div>

      {/* Middle row: L, F, R, B */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-1">
        {renderFace('L')}
        {renderFace('F')}
        {renderFace('R')}
        {renderFace('B')}
      </div>

      {/* Bottom row: D */}
      <div className="flex justify-center">
        {renderFace('D')}
      </div>
    </div>
  );
};
