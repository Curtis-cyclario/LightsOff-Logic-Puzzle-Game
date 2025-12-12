import React from 'react';
import type { Theme, CellState } from '../App';

interface GridCellProps {
  isOn: boolean;
  rowIndex: number;
  colIndex: number;
  onClick: (row: number, col: number) => void;
  isWon: boolean;
  board: CellState[][];
  theme: Theme;
  pulseEnabled: boolean;
}

const GridCell: React.FC<GridCellProps> = ({ isOn, rowIndex, colIndex, onClick, isWon, board, theme, pulseEnabled }) => {
  const scheme = theme.cell.schemes[(rowIndex + colIndex) % theme.cell.schemes.length];
  const boardSize = board.length;

  const baseClasses = "relative aspect-square rounded-lg shadow-lg bg-slate-800 shadow-slate-900/50 transition-all duration-200 ease-in-out transform overflow-hidden";
  
  const interactionClasses = isWon 
    ? "cursor-not-allowed" 
    : "hover:scale-105 hover:shadow-xl hover:bg-slate-700 active:scale-95 cursor-pointer";

  const onStateOverlayClasses = `absolute inset-0 w-full h-full rounded-lg ${scheme.bg} shadow-xl ${scheme.shadow} transition-all duration-300 ease-in-out group-hover:brightness-110 group-hover:animate-none`;
  
  // The "on" state overlay should be hidden when the game is won
  // Added 'kernel-animate' to enable the pulsing effect on active cells, conditional on pulseEnabled
  const animationClasses = isOn && !isWon
    ? `scale-100 opacity-100 ${pulseEnabled ? 'kernel-animate' : ''}` 
    : 'scale-75 opacity-0';
  
  const hasTopNeighbor = rowIndex > 0 && board[rowIndex - 1][colIndex].isOn;
  const hasBottomNeighbor = rowIndex < boardSize - 1 && board[rowIndex + 1][colIndex].isOn;
  const hasLeftNeighbor = colIndex > 0 && board[rowIndex][colIndex - 1].isOn;
  const hasRightNeighbor = colIndex < board[0].length - 1 && board[rowIndex][colIndex + 1].isOn;

  // Emitters should also be hidden when the game is won
  const emitterContainerClasses = `absolute inset-0 transition-opacity duration-300 ease-in-out pointer-events-none ${isOn && !isWon ? 'opacity-100' : 'opacity-0'}`;

  const emitterBase = "absolute";
  const emitterTop = `top-0 left-1/2 -translate-x-1/2 h-[45%] w-1/3 bg-gradient-to-t ${scheme.gradientFrom} to-transparent`;
  const emitterBottom = `bottom-0 left-1/2 -translate-x-1/2 h-[45%] w-1/3 bg-gradient-to-b ${scheme.gradientFrom} to-transparent`;
  const emitterLeft = `left-0 top-1/2 -translate-y-1/2 w-[45%] h-1/3 bg-gradient-to-l ${scheme.gradientFrom} to-transparent`;
  const emitterRight = `right-0 top-1/2 -translate-y-1/2 w-[45%] h-1/3 bg-gradient-to-r ${scheme.gradientFrom} to-transparent`;
  
  const winAnimationDelay = isWon ? `${(rowIndex * boardSize + colIndex) * 30}ms` : '0ms';

  return (
    <button
      onClick={() => !isWon && onClick(rowIndex, colIndex)}
      className={`${baseClasses} ${interactionClasses} group`}
      aria-label={`Cell at row ${rowIndex + 1}, column ${colIndex + 1} is ${isOn ? 'on' : 'off'}`}
      disabled={isWon}
    >
      <div className={`${onStateOverlayClasses} ${animationClasses}`}>
        <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_10px_rgba(255,255,255,0.7)]" />
      </div>

      <div className={emitterContainerClasses}>
        {hasTopNeighbor && <div className={`${emitterBase} ${emitterTop}`} />}
        {hasBottomNeighbor && <div className={`${emitterBase} ${emitterBottom}`} />}
        {hasLeftNeighbor && <div className={`${emitterBase} ${emitterLeft}`} />}
        {hasRightNeighbor && <div className={`${emitterBase} ${emitterRight}`} />}
      </div>

      {isWon && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ animationDelay: winAnimationDelay }}
        >
          <div 
            className={`win-glow-animate w-2/3 h-2/3 rounded-full ${scheme.bg} opacity-0`}
            style={{
              boxShadow: `0 0 15px ${scheme.shadow.split('/')[0]}`,
              willChange: 'transform, opacity',
            }}
          />
        </div>
      )}
    </button>
  );
};

export default GridCell;