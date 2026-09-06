import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CubeColor,
  FaceletColors,
  FaceName,
  MoveName,
  SolutionStep,
} from './types/cube';
import {
  getSolvedFacelets,
  applyMoveToFacelets,
  validateAndExtractState,
  getInverseMove,
} from './utils/cubeMath';
import { solveCube, generateRandomScramble } from './utils/cubeSolver';
import { Cube3D } from './components/Cube3D';
import { CubeNet2D } from './components/CubeNet2D';
import { ColorPalette } from './components/ColorPalette';
import { SolutionPlayer } from './components/SolutionPlayer';
import { ManualControls } from './components/ManualControls';
import {
  Box,
  Grid,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function App() {
  // Current facelet state
  const [facelets, setFacelets] = useState<FaceletColors>(getSolvedFacelets);

  // Active color for painting/brushing
  const [activeColor, setActiveColor] = useState<CubeColor>('white');

  // View mode: '3d' (3D viewport) or 'net' (2D unfolded net) or 'split' (side-by-side on desktop)
  const [viewMode, setViewMode] = useState<'3d' | 'net' | 'split'>('3d');

  // Solver solution state
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [solutionStates, setSolutionStates] = useState<FaceletColors[]>([]);

  // Animation & Playback state
  const [animatingMove, setAnimatingMove] = useState<MoveName | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // Recent moves log
  const [recentMoves, setRecentMoves] = useState<MoveName[]>([]);

  // Show guide modal/accordion
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Validation
  const validation = useMemo(() => validateAndExtractState(facelets), [facelets]);

  // Check if current facelets is solved
  const isSolved = useMemo(() => {
    const solved = getSolvedFacelets();
    const faces: FaceName[] = ['U', 'D', 'F', 'B', 'L', 'R'];
    for (const f of faces) {
      for (let i = 0; i < 4; i++) {
        if (facelets[f][i] !== solved[f][i]) return false;
      }
    }
    return true;
  }, [facelets]);

  // Queue of moves for multi-move animations (e.g. scramble or auto-play)
  const moveQueueRef = useRef<MoveName[]>([]);
  const onQueueFinishRef = useRef<(() => void) | null>(null);

  // Handler for sticker click in either 3D or 2D
  const handleStickerClick = useCallback(
    (face: FaceName, index: number) => {
      if (animatingMove || isPlaying) return;

      setFacelets((prev) => {
        const next = {
          ...prev,
          [face]: [...prev[face]] as [CubeColor, CubeColor, CubeColor, CubeColor],
        };
        next[face][index] = activeColor;
        return next;
      });

      // Clear existing solution since cube state changed
      setSolutionSteps([]);
      setCurrentStepIndex(0);
      setSolutionStates([]);
      setIsPlaying(false);
    },
    [activeColor, animatingMove, isPlaying],
  );

  // Execute a single move directly
  const applySingleMove = useCallback(
    (move: MoveName) => {
      if (animatingMove) return;
      setAnimatingMove(move);
      setRecentMoves((prev) => [...prev.slice(-20), move]);
    },
    [animatingMove],
  );

  // Animation end callback from 3D canvas
  const handleAnimationEnd = useCallback(() => {
    if (!animatingMove) return;

    // Apply the finished move to the facelets state
    setFacelets((prev) => applyMoveToFacelets(prev, animatingMove));
    setAnimatingMove(null);

    // If there is an ongoing solution playback
    if (isPlaying) {
      setCurrentStepIndex((prevIdx) => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= solutionSteps.length) {
          setIsPlaying(false);
          return solutionSteps.length;
        }
        return nextIdx;
      });
    }

    // Check if there are queued moves (e.g. scramble sequence)
    if (moveQueueRef.current.length > 0) {
      const nextMove = moveQueueRef.current.shift()!;
      setTimeout(() => {
        setAnimatingMove(nextMove);
      }, 50);
    } else if (onQueueFinishRef.current) {
      const cb = onQueueFinishRef.current;
      onQueueFinishRef.current = null;
      cb();
    }
  }, [animatingMove, isPlaying, solutionSteps.length]);

  // Continue auto-playing next step
  useEffect(() => {
    if (!isPlaying || animatingMove) return;

    if (currentStepIndex < solutionSteps.length) {
      const nextStep = solutionSteps[currentStepIndex];
      const timer = setTimeout(() => {
        setAnimatingMove(nextStep.move);
      }, Math.max(120, 260 / speed));
      return () => clearTimeout(timer);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying, animatingMove, currentStepIndex, solutionSteps, speed]);

  // Auto Solve function
  const handleAutoSolve = useCallback(() => {
    if (!validation.valid || isSolved || animatingMove) return;

    setIsSolving(true);
    setIsPlaying(false);

    // Run solver
    setTimeout(() => {
      const res = solveCube(facelets);
      setIsSolving(false);

      if (res.success && res.steps.length > 0) {
        setSolutionSteps(res.steps);
        setCurrentStepIndex(0);

        // Precompute state at each step:
        const states: FaceletColors[] = [facelets];
        let curr = facelets;
        for (const s of res.steps) {
          curr = applyMoveToFacelets(curr, s.move);
          states.push(curr);
        }
        setSolutionStates(states);
      }
    }, 50);
  }, [facelets, validation.valid, isSolved, animatingMove]);

  // Step controls for SolutionPlayer
  const handlePlay = useCallback(() => {
    if (solutionSteps.length === 0) return;
    if (currentStepIndex >= solutionSteps.length) {
      // Restart from step 0
      if (solutionStates[0]) {
        setFacelets(solutionStates[0]);
      }
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [solutionSteps.length, currentStepIndex, solutionStates]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    if (animatingMove || currentStepIndex >= solutionSteps.length) return;
    setIsPlaying(false);
    const move = solutionSteps[currentStepIndex].move;
    setAnimatingMove(move);
    setCurrentStepIndex((prev) => prev + 1);
  }, [animatingMove, currentStepIndex, solutionSteps]);

  const handleStepBackward = useCallback(() => {
    if (animatingMove || currentStepIndex <= 0) return;
    setIsPlaying(false);
    const prevMove = solutionSteps[currentStepIndex - 1].move;
    const invMove = getInverseMove(prevMove);
    setAnimatingMove(invMove);
    setCurrentStepIndex((prev) => prev - 1);
  }, [animatingMove, currentStepIndex, solutionSteps]);

  const handleJumpToStart = useCallback(() => {
    if (animatingMove) return;
    setIsPlaying(false);
    if (solutionStates[0]) {
      setFacelets(solutionStates[0]);
    }
    setCurrentStepIndex(0);
  }, [animatingMove, solutionStates]);

  const handleJumpToEnd = useCallback(() => {
    if (animatingMove) return;
    setIsPlaying(false);
    const lastIdx = solutionStates.length - 1;
    if (solutionStates[lastIdx]) {
      setFacelets(solutionStates[lastIdx]);
    }
    setCurrentStepIndex(solutionSteps.length);
  }, [animatingMove, solutionStates, solutionSteps.length]);

  const handleSelectStep = useCallback(
    (targetIdx: number) => {
      if (animatingMove || targetIdx < 0 || targetIdx > solutionSteps.length) return;
      setIsPlaying(false);
      if (solutionStates[targetIdx]) {
        setFacelets(solutionStates[targetIdx]);
      }
      setCurrentStepIndex(targetIdx);
    },
    [animatingMove, solutionStates, solutionSteps.length],
  );

  // Random scramble
  const handleRandomScramble = useCallback(() => {
    if (animatingMove || isPlaying) return;

    const scramble = generateRandomScramble(7);
    setRecentMoves((prev) => [...prev, ...scramble]);
    setSolutionSteps([]);
    setCurrentStepIndex(0);
    setSolutionStates([]);
    setIsPlaying(false);

    // Queue animated turns
    moveQueueRef.current = [...scramble];
    const first = moveQueueRef.current.shift()!;
    setAnimatingMove(first);
  }, [animatingMove, isPlaying]);

  // Reset to solved state
  const handleResetSolved = useCallback(() => {
    if (animatingMove) return;
    setIsPlaying(false);
    setFacelets(getSolvedFacelets());
    setSolutionSteps([]);
    setCurrentStepIndex(0);
    setSolutionStates([]);
    setRecentMoves([]);
  }, [animatingMove]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-indigo-950">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                二阶魔方解答器
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  2x2 Solver
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                自定义配色 · 3D旋转动画演示 · 最优解法自动解析
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-guide"
              onClick={() => setShowGuide((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>使用指南</span>
            </button>

            <button
              id="btn-nav-reset"
              onClick={handleResetSolved}
              title="复位魔方"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">复位</span>
            </button>
          </div>
        </div>
      </header>

      {/* Collapsible Guide Accordion */}
      {showGuide && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3.5 animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-slate-300">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="font-semibold text-indigo-400 mb-1 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" /> 1. 自定义配色或打乱
              </div>
              <div>
                点击调色板选择颜色，直接在 <strong>3D魔方</strong> 或 <strong>2D展开图</strong> 对应色块上点击填色。也可点击“随机打乱”快速生成混色魔方。
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="font-semibold text-sky-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 2. 一键自动解析
              </div>
              <div>
                系统内置毫秒级双向最优搜索算法，支持检查角块合法性，并在毫秒内计算出 <strong>全球最少旋转步数</strong>（God's Number ≤ 11 步）。
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> 3. 3D平滑动画演示
              </div>
              <div>
                支持自动播放、单步前进/后退、倍速调节（0.5x~2x）及时间轴任意跳转，带有清晰的顺时针/逆时针中文解释与旋转层标记。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 3D Visualizer, Net, & Solution Player (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Visualizer Card */}
          <div className="flex-1 flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl overflow-hidden backdrop-blur min-h-[420px]">
            {/* Visualizer View Mode Tabs */}
            <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  id="tab-view-3d"
                  onClick={() => setViewMode('3d')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === '3d'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>3D 视角</span>
                </button>

                <button
                  id="tab-view-net"
                  onClick={() => setViewMode('net')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'net'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>2D 展开图</span>
                </button>

                <button
                  id="tab-view-split"
                  onClick={() => setViewMode('split')}
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    viewMode === 'split'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>双视图</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>可鼠标拖拽自由旋转视角 / 滚轮缩放</span>
              </div>
            </div>

            {/* Viewport Canvas Container */}
            <div className="flex-1 relative flex items-center justify-center p-2 min-h-[380px]">
              {viewMode === '3d' && (
                <Cube3D
                  facelets={facelets}
                  onStickerClick={handleStickerClick}
                  animatingMove={animatingMove}
                  onAnimationEnd={handleAnimationEnd}
                  speed={speed}
                />
              )}

              {viewMode === 'net' && (
                <div className="w-full h-full flex flex-col items-center justify-center py-4">
                  <div className="text-xs text-slate-400 mb-2 font-medium">
                    2D展开图（点击任意小方块填入当前选中颜色）
                  </div>
                  <CubeNet2D
                    facelets={facelets}
                    onStickerClick={handleStickerClick}
                    activeColor={activeColor}
                  />
                </div>
              )}

              {viewMode === 'split' && (
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                  <div className="w-full h-full min-h-[320px]">
                    <Cube3D
                      facelets={facelets}
                      onStickerClick={handleStickerClick}
                      animatingMove={animatingMove}
                      onAnimationEnd={handleAnimationEnd}
                      speed={speed}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center p-2">
                    <div className="text-xs text-slate-400 mb-2 font-medium">
                      展开图配色网格
                    </div>
                    <CubeNet2D
                      facelets={facelets}
                      onStickerClick={handleStickerClick}
                      activeColor={activeColor}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Solution Player (Visible when steps are generated) */}
          {solutionSteps.length > 0 && (
            <SolutionPlayer
              steps={solutionSteps}
              currentStepIndex={currentStepIndex}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onJumpToStart={handleJumpToStart}
              onJumpToEnd={handleJumpToEnd}
              onSelectStep={handleSelectStep}
              speed={speed}
              onChangeSpeed={setSpeed}
              isAnimating={animatingMove !== null}
            />
          )}
        </div>

        {/* Right Column: Color Palette & Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Color Palette & Status */}
          <ColorPalette
            activeColor={activeColor}
            onSelectColor={setActiveColor}
            colorCounts={validation.colorCounts}
            validationMessage={validation.error}
            isValid={validation.valid}
            isSolved={isSolved}
            onResetSolved={handleResetSolved}
            onRandomScramble={handleRandomScramble}
          />

          {/* Manual Control Keypad & Auto Solve */}
          <ManualControls
            onApplyMove={applySingleMove}
            onAutoSolve={handleAutoSolve}
            onRandomScramble={handleRandomScramble}
            isSolving={isSolving}
            isValid={validation.valid}
            isSolved={isSolved}
            isAnimating={animatingMove !== null}
            recentMoves={recentMoves}
            onClearHistory={() => setRecentMoves([])}
          />

          {/* Rubik's Cube Notation Quick Reference */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <div className="font-semibold text-slate-300 mb-1.5">
              魔方转动代号速查：
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-1 font-mono text-[11px]">
              <div><strong className="text-indigo-300">U</strong>: 顶层顺时针</div>
              <div><strong className="text-indigo-300">U'</strong>: 顶层逆时针</div>
              <div><strong className="text-indigo-300">U2</strong>: 顶层180°</div>
              <div><strong className="text-emerald-300">F</strong>: 前层顺时针</div>
              <div><strong className="text-emerald-300">F'</strong>: 前层逆时针</div>
              <div><strong className="text-emerald-300">F2</strong>: 前层180°</div>
              <div><strong className="text-rose-300">R</strong>: 右层顺时针</div>
              <div><strong className="text-rose-300">R'</strong>: 右层逆时针</div>
              <div><strong className="text-rose-300">R2</strong>: 右层180°</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
