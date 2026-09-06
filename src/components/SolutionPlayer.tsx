import React, { useEffect } from 'react';
import { SolutionStep } from '../types/cube';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gauge,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SolutionPlayerProps {
  steps: SolutionStep[];
  currentStepIndex: number; // 0 to steps.length
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onSelectStep: (stepIndex: number) => void;
  speed: number;
  onChangeSpeed: (newSpeed: number) => void;
  isAnimating: boolean;
}

export const SolutionPlayer: React.FC<SolutionPlayerProps> = ({
  steps,
  currentStepIndex,
  isPlaying,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  onSelectStep,
  speed,
  onChangeSpeed,
  isAnimating,
}) => {
  const totalSteps = steps.length;
  const isCompleted = currentStepIndex >= totalSteps && totalSteps > 0;
  const activeStep = steps[currentStepIndex] || null;

  // Trigger confetti when completed
  useEffect(() => {
    if (isCompleted) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#34d399', '#facc15', '#f87171'],
      });
    }
  }, [isCompleted]);

  if (totalSteps === 0) {
    return null;
  }

  const progressPercent = Math.min(100, Math.round((currentStepIndex / totalSteps) * 100));

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            还原演示流程 ({currentStepIndex}/{totalSteps} 步)
          </h3>
        </div>
        <div className="text-xs font-mono font-medium text-emerald-400">
          {progressPercent}% 完成
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Current Step Spotlight Card */}
      <div className="relative overflow-hidden p-3.5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/80 flex items-center justify-between shadow-inner">
        {isCompleted ? (
          <div className="flex items-center gap-3 w-full py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-300">
                恭喜！魔方已完全还原！
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                已执行完全部 {totalSteps} 个最优解旋转步骤。
              </div>
            </div>
          </div>
        ) : activeStep ? (
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-mono font-extrabold text-xl shrink-0 shadow-sm">
              {activeStep.move}
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                当前步骤 #{activeStep.stepNumber}
              </div>
              <div className="text-sm font-semibold text-slate-100 mt-0.5">
                {activeStep.description}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">点击播放或单步按钮开始演示</div>
        )}

        {/* Speed Selector */}
        <div className="flex items-center gap-1 shrink-0">
          <Gauge className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-0.5 rounded-md font-mono transition-colors ${
                  speed === s
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Playback Controls */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          id="btn-step-start"
          onClick={onJumpToStart}
          disabled={currentStepIndex === 0 || isAnimating}
          title="跳转到初始状态"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-slate-700 transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          id="btn-step-prev"
          onClick={onStepBackward}
          disabled={currentStepIndex === 0 || isAnimating}
          title="上一步"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          id="btn-play-pause"
          onClick={isPlaying ? onPause : onPlay}
          disabled={isCompleted && !isPlaying}
          title={isPlaying ? '暂停' : '自动播放演示'}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-md active:scale-95 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>暂停</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{isCompleted ? '已完成' : '自动演示'}</span>
            </>
          )}
        </button>

        <button
          id="btn-step-next"
          onClick={onStepForward}
          disabled={currentStepIndex >= totalSteps || isAnimating}
          title="下一步"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-slate-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          id="btn-step-end"
          onClick={onJumpToEnd}
          disabled={currentStepIndex >= totalSteps || isAnimating}
          title="直接跳转到完成"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 border border-slate-700 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scrollable Step Chips Timeline */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 scrollbar-thin scrollbar-thumb-slate-700">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;

          return (
            <button
              key={step.stepNumber}
              id={`step-chip-${idx}`}
              onClick={() => onSelectStep(idx)}
              disabled={isAnimating}
              title={`点击跳转至步骤 #${step.stepNumber} (${step.notation}): ${step.description}`}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 transition-all border ${
                isCurrent
                  ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-md scale-105'
                  : isDone
                  ? 'bg-slate-950/80 border-emerald-900/60 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] opacity-60">#{step.stepNumber}</span>
              <span>{step.notation}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
