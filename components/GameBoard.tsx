import React, { useMemo } from 'react';
import GridCell from './GridCell';
import type { Theme, CellState, WinIntensity } from '../App';

interface GameBoardProps {
  board: CellState[][];
  onCellClick: (row: number, col: number) => void;
  isWon: boolean;
  lastClick: { row: number, col: number, key: number } | null;
  theme: Theme;
  pulseEnabled: boolean;
  winIntensity: WinIntensity;
}

const getCellColor = (r: number, c: number, colors: string[]) => {
    const colorIndex = (r + c) % colors.length;
    return colors[colorIndex];
};

interface ClickEffectsProps {
    lastClick: { row: number, col: number };
    boardSize: number;
    theme: Theme;
}

const ClickEffects: React.FC<ClickEffectsProps> = ({ lastClick, boardSize, theme }) => {
    const { row, col } = lastClick;
    const rippleColor = getCellColor(row, col, theme.cell.pathColors);
    const cellSizePercent = 100 / boardSize;

    const rippleStyle: React.CSSProperties = {
        width: `${cellSizePercent}%`,
        height: `${cellSizePercent}%`,
        top: `${row * cellSizePercent + cellSizePercent / 2}%`,
        left: `${col * cellSizePercent + cellSizePercent / 2}%`,
        borderColor: rippleColor,
    };

    // Standard 'plus' pattern for click effect, as kernels are removed
    const locations: number[][] = [
        [row, col],
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
    ];


    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <div className="click-ripple" style={rippleStyle} />
            {locations.map(([r, c], index) => {
                if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                    const hitStyle: React.CSSProperties = {
                        width: `calc(${cellSizePercent}% - 8px)`, // grid gap is 0.5rem (8px)
                        height: `calc(${cellSizePercent}% - 8px)`,
                        top: `calc(${r * cellSizePercent}% + 4px)`, // offset by half the gap
                        left: `calc(${c * cellSizePercent}% + 4px)`,
                    };
                    return <div key={index} className="click-hit" style={hitStyle} />;
                }
                return null;
            })}
        </div>
    );
};

const VictoryEffects: React.FC<{ theme: Theme; intensity: WinIntensity }> = ({ theme, intensity }) => {
    const particleCount = intensity === 'low' ? 10 : intensity === 'high' ? 60 : 30;

    // Generate static random positions for sparkles to avoid re-renders jitter
    const sparkles = useMemo(() => {
        return Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            color: theme.cell.pathColors[i % theme.cell.pathColors.length],
            size: Math.random() > 0.5 ? 'w-2 h-2' : 'w-1 h-1'
        }));
    }, [theme, particleCount]);

    return (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-xl">
            {/* Flash Overlay */}
            <div className="absolute inset-0 victory-flash-animate mix-blend-overlay" />
            
            {/* Shockwaves - only for normal/high intensity */}
            {intensity !== 'low' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-1/2 h-1/2 rounded-full border-4 border-white opacity-0 victory-shockwave" style={{animationDelay: '0.1s'}} />
                    <div className="w-1/2 h-1/2 rounded-full border-2 border-white opacity-0 victory-shockwave" style={{animationDelay: '0.4s'}} />
                </div>
            )}

            {/* Sparkles */}
            {sparkles.map((s) => (
                <div 
                    key={s.id}
                    className={`absolute rounded-full victory-sparkle ${s.size}`}
                    style={{
                        left: s.left,
                        top: s.top,
                        backgroundColor: s.color,
                        boxShadow: `0 0 8px 2px ${s.color}`,
                        animationDelay: s.animationDelay
                    }}
                />
            ))}
        </div>
    );
};

const GameBoard: React.FC<GameBoardProps> = ({ board, onCellClick, isWon, lastClick, theme, pulseEnabled, winIntensity }) => {
  const gradients: React.ReactElement[] = [];
  const pathways: { key: string; x1: string; y1: string; x2: string; y2: string; stroke: string }[] = [];
  const boardSize = board.length;
  const pathColors = theme.cell.pathColors;

  if (!isWon) {
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c].isOn) {
          const x1 = `${(c * 2 + 1) * 100 / (boardSize * 2)}%`;
          const y1 = `${(r * 2 + 1) * 100 / (boardSize * 2)}%`;
          
          if (c + 1 < board[r].length && board[r][c + 1].isOn) {
            const color1 = getCellColor(r, c, pathColors);
            const color2 = getCellColor(r, c + 1, pathColors);
            const gradientId = `grad-h-${r}-${c}`;
            gradients.push(
              <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color1} />
                <stop offset="100%" stopColor={color2} />
              </linearGradient>
            );
            pathways.push({
              key: `h-${r}-${c}`, x1, y1,
              x2: `${((c + 1) * 2 + 1) * 100 / (boardSize * 2)}%`, y2: y1,
              stroke: `url(#${gradientId})`,
            });
          }
          if (r + 1 < boardSize && board[r + 1][c].isOn) {
            const color1 = getCellColor(r, c, pathColors);
            const color2 = getCellColor(r + 1, c, pathColors);
            const gradientId = `grad-v-${r}-${c}`;
            gradients.push(
              <linearGradient key={gradientId} id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color1} />
                <stop offset="100%" stopColor={color2} />
              </linearGradient>
            );
            pathways.push({
              key: `v-${r}-${c}`, x1, y1, x2: x1,
              y2: `${((r + 1) * 2 + 1) * 100 / (boardSize * 2)}%`,
              stroke: `url(#${gradientId})`,
            });
          }
        }
      }
    }
  }

  const gridStyle = {
    gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
  };

  return (
    <div className="p-2 bg-slate-900/50 rounded-xl shadow-inner w-full">
      <div className="relative">
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            {gradients}
            <filter id="photon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#photon-glow)">
            {pathways.map(path => (
              <line
                key={path.key}
                x1={path.x1} y1={path.y1}
                x2={path.x2} y2={path.y2}
                stroke={path.stroke}
                strokeWidth="3"
                strokeLinecap="round"
                className="photonic-path"
              />
            ))}
          </g>
        </svg>

        <div className="relative grid gap-2" style={gridStyle}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <GridCell
                key={`${rowIndex}-${colIndex}`}
                isOn={cell.isOn}
                rowIndex={rowIndex}
                colIndex={colIndex}
                onClick={onCellClick}
                isWon={isWon}
                board={board}
                theme={theme}
                pulseEnabled={pulseEnabled}
              />
            ))
          )}
        </div>

        {/* Effects are rendered last to appear on top */}
        {lastClick && (
            <ClickEffects key={lastClick.key} lastClick={lastClick} boardSize={boardSize} theme={theme} />
        )}

        {/* Victory Board Overlay */}
        {isWon && <VictoryEffects theme={theme} intensity={winIntensity} />}
      </div>
    </div>
  );
};

export default GameBoard;