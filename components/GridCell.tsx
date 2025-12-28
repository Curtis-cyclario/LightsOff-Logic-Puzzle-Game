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

  const baseClasses = "relative aspect-square rounded-xl shadow-lg bg-slate-800/80 shadow-slate-950/20 transition-all duration-300 ease-out transform overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
  
  const interactionClasses = isWon 
    ? "cursor-default" 
    : "hover:scale-[1.03] hover:shadow-2xl hover:bg-slate-700/80 active:scale-95 cursor-pointer";

  const onStateOverlayClasses = `absolute inset-0 w-full h-full rounded-xl ${scheme.bg} shadow-xl ${scheme.shadow} transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) group-hover:brightness-110 group-hover:animate-none`;
  
  const animationClasses = isOn && !isWon
    ? `scale-100 opacity-100 ${pulseEnabled ? 'kernel-animate' : ''}` 
    : 'scale-[0.8] opacity-0';
  
  const hasTopNeighbor = rowIndex > 0 && board[rowIndex - 1][colIndex].isOn;
  const hasBottomNeighbor = rowIndex < boardSize - 1 && board[rowIndex + 1][colIndex].isOn;
  const hasLeftNeighbor = colIndex > 0 && board[rowIndex][colIndex - 1].isOn;
  const hasRightNeighbor = colIndex < board[0].length - 1 && board[rowIndex][colIndex + 1].isOn;

  const emitterContainerClasses = `absolute inset-0 transition-opacity duration-500 ease-in-out pointer-events-none ${isOn && !isWon ? 'opacity-100' : 'opacity-0'}`;

  const emitterBase = "absolute transition-all duration-500";
  const emitterTop = `top-0 left-1/2 -translate-x-1/2 h-[40%] w-1/4 bg-gradient-to-t ${scheme.gradientFrom} to-transparent`;
  const emitterBottom = `bottom-0 left-1/2 -translate-x-1/2 h-[40%] w-1/4 bg-gradient-to-b ${scheme.gradientFrom} to-transparent`;
  const emitterLeft = `left-0 top-1/2 -translate-y-1/2 w-[40%] h-1/4 bg-gradient-to-l ${scheme.gradientFrom} to-transparent`;
  const emitterRight = `right-0 top-1/2 -translate-y-1/2 w-[40%] h-1/4 bg-gradient-to-r ${scheme.gradientFrom} to-transparent`;
  
  const winAnimationDelay = isWon ? `${(rowIndex * boardSize + colIndex) * 20}ms` : '0ms';

  return (
    <button
      onClick={() => !isWon && onClick(rowIndex, colIndex)}
      className={`${baseClasses} ${interactionClasses} group`}
      aria-label={`Cell at ${rowIndex + 1},${colIndex + 1} - ${isOn ? 'Active' : 'Inactive'}`}
      disabled={isWon}
    >
      <div className={`${onStateOverlayClasses} ${animationClasses}`}>
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_12px_rgba(255,255,255,0.4)]" />
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
            className={`win-glow-animate w-3/4 h-3/4 rounded-full ${scheme.bg} opacity-0`}
            style={{
              boxShadow: `0 0 20px ${scheme.shadow.split('/')[0]}`,
              willChange: 'transform, opacity',
            }}
          />
        </div>
      )}
    </button>
  );
};

export default React.memo(GridCell);