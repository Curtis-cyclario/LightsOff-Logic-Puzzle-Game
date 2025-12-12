import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './components/GameBoard';

const SIZES = [3, 4, 5];
type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';
type Difficulty = 'easy' | 'medium' | 'hard';
export type WinIntensity = 'low' | 'normal' | 'high';

export type CellState = {
    isOn: boolean;
};

// --- THEME DEFINITIONS ---
type ThemeName = 'vibrant' | 'synthwave' | 'noir';

export type Theme = {
    name: string;
    bg: string;
    text: string;
    header: string;
    paragraph: string;
    sizeButton: {
        active: string;
        inactive: string;
    };
    panel: string;
    winMessage: string;
    cell: {
        schemes: {
            bg: string;
            shadow: string;
            gradientFrom: string;
        }[];
        pathColors: string[];
    };
};

const THEMES: Record<ThemeName, Theme> = {
    vibrant: {
        name: 'Vibrant',
        bg: 'bg-slate-950',
        text: 'text-gray-200',
        header: 'text-violet-400',
        paragraph: 'text-gray-400',
        sizeButton: {
            active: 'bg-violet-600 text-white shadow-md',
            inactive: 'bg-slate-800 hover:bg-slate-700 text-gray-300'
        },
        panel: 'bg-slate-800/50',
        winMessage: 'bg-emerald-500/20 border border-emerald-500 text-emerald-300',
        cell: {
            schemes: [
                { bg: 'bg-fuchsia-500', shadow: 'shadow-fuchsia-500/50', gradientFrom: 'from-fuchsia-500/70' },
                { bg: 'bg-cyan-400', shadow: 'shadow-cyan-400/50', gradientFrom: 'from-cyan-400/70' },
                { bg: 'bg-lime-400', shadow: 'shadow-lime-400/50', gradientFrom: 'from-lime-400/70' }
            ],
            pathColors: ['#d946ef', '#22d3ee', '#a3e635']
        }
    },
    synthwave: {
        name: 'Synthwave',
        bg: 'bg-black',
        text: 'text-cyan-300',
        header: 'text-fuchsia-400',
        paragraph: 'text-cyan-400',
        sizeButton: {
            active: 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/50',
            inactive: 'bg-gray-900 hover:bg-gray-800 text-cyan-300'
        },
        panel: 'bg-gray-900/50 border border-fuchsia-500/30',
        winMessage: 'bg-cyan-500/20 border border-cyan-500 text-cyan-300',
        cell: {
            schemes: [
                { bg: 'bg-fuchsia-500', shadow: 'shadow-fuchsia-400/50', gradientFrom: 'from-fuchsia-500/80' },
                { bg: 'bg-cyan-400', shadow: 'shadow-cyan-300/50', gradientFrom: 'from-cyan-400/80' },
                { bg: 'bg-rose-500', shadow: 'shadow-rose-400/50', gradientFrom: 'from-rose-500/80' },
            ],
            pathColors: ['#f0abfc', '#67e8f9', '#fb7185']
        }
    },
    noir: {
        name: 'Noir',
        bg: 'bg-gray-900',
        text: 'text-gray-100',
        header: 'text-white font-serif',
        paragraph: 'text-gray-400',
        sizeButton: {
            active: 'bg-white text-black shadow-md',
            inactive: 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        },
        panel: 'bg-gray-800/50',
        winMessage: 'bg-gray-500/20 border border-gray-400 text-gray-200',
        cell: {
            schemes: [
                { bg: 'bg-white', shadow: 'shadow-gray-400/50', gradientFrom: 'from-white/70' },
                { bg: 'bg-gray-300', shadow: 'shadow-gray-500/50', gradientFrom: 'from-gray-300/70' },
                { bg: 'bg-gray-400', shadow: 'shadow-gray-600/50', gradientFrom: 'from-gray-400/70' },
            ],
            pathColors: ['#ffffff', '#d1d5db', '#9ca3af']
        }
    }
};


// Pure function to toggle a cell and its direct neighbors
const toggleCellAndNeighbors = (row: number, col: number, currentBoard: CellState[][], boardSize: number): CellState[][] => {
    const newBoard = currentBoard.map(r => r.map(c => ({ ...c }))); // Deep copy

    const toggle = (r: number, c: number) => {
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
            newBoard[r][c].isOn = !newBoard[r][c].isOn;
        }
    };

    toggle(row, col); // Clicked cell
    toggle(row - 1, col); // Top
    toggle(row + 1, col); // Bottom
    toggle(row, col - 1); // Left
    toggle(row, col + 1); // Right

    return newBoard;
};

// Helper function to create a new board, guaranteed to be solvable
const createSolvableBoard = (boardSize: number, difficulty: Difficulty): CellState[][] => {
    let boardState: CellState[][] = Array(boardSize).fill(null).map(() => 
        Array(boardSize).fill(null).map(() => ({
            isOn: false,
        }))
    );

    const scrambleToggle = (r: number, c: number, b: CellState[][]): CellState[][] => {
        const nextBoard = b.map(row => row.map(cell => ({...cell})));
        const toggle = (r_t: number, c_t: number) => {
            if (r_t >= 0 && r_t < boardSize && c_t >= 0 && c_t < boardSize) {
                nextBoard[r_t][c_t].isOn = !nextBoard[r_t][c_t].isOn;
            }
        };
        toggle(r, c); toggle(r-1,c); toggle(r+1,c); toggle(r,c-1); toggle(r,c+1);
        return nextBoard;
    };
    
    let scrambleMovesCount: number;
    switch (difficulty) {
        case 'easy':
            scrambleMovesCount = Math.floor(boardSize * 1.5);
            break;
        case 'hard':
            scrambleMovesCount = boardSize * boardSize;
            break;
        case 'medium':
        default:
            scrambleMovesCount = Math.floor(boardSize * 2.5);
            break;
    }

    for (let i = 0; i < scrambleMovesCount; i++) {
        const randRow = Math.floor(Math.random() * boardSize);
        const randCol = Math.floor(Math.random() * boardSize);
        boardState = scrambleToggle(randRow, randCol, boardState);
    }

    if (boardState.flat().every(cell => !cell.isOn)) {
        return createSolvableBoard(boardSize, difficulty);
    }

    return boardState;
};

// --- Audio Generation ---
const playSound = (
    type: 'click' | 'win' | 'reset', 
    audioCtx: AudioContext | null,
    options: { 
        board?: CellState[][]; 
        row?: number; 
        col?: number; 
        boardSize?: number;
        soundSettings: {
            enabled: boolean;
            waveform: Waveform;
            interactive: boolean;
        }
    }
) => {
    if (!audioCtx || !options.soundSettings.enabled) return;

    const now = audioCtx.currentTime;
    const { waveform, interactive } = options.soundSettings;
    
    if (type === 'click') {
        const { board, row, col, boardSize } = options;
        if (board === undefined || row === undefined || col === undefined || boardSize === undefined) return;

        const pentatonicSteps = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
        const totalCells = boardSize * boardSize;
        const cellIndex = row * boardSize + col;
        const scaleIndex = Math.round(((pentatonicSteps.length - 1) * cellIndex) / (totalCells - 1));
        const note = pentatonicSteps[scaleIndex];
        const rootFrequency = 220; // A2
        const frequency = rootFrequency * Math.pow(2, note / 12);

        if (interactive) {
             const activeCells = board.flat().filter(cell => cell.isOn).length;
            const onRatio = totalCells > 0 ? activeCells / totalCells : 0;

            const getActiveNeighbors = (r: number, c: number, b: CellState[][], size: number): number => {
                let count = 0;
                if (r > 0 && b[r - 1][c].isOn) count++;
                if (r < size - 1 && b[r + 1][c].isOn) count++;
                if (c > 0 && b[r][c - 1].isOn) count++;
                if (c < size - 1 && b[r][c + 1].isOn) count++;
                return count;
            };
            const activeNeighbors = getActiveNeighbors(row, col, board, boardSize);
            const neighborRatio = activeNeighbors / 4.0;

            const mainOsc = audioCtx.createOscillator();
            const mainGain = audioCtx.createGain();
            mainOsc.type = waveform;
            mainOsc.frequency.setValueAtTime(frequency, now);

            const triOsc = audioCtx.createOscillator();
            const triGain = audioCtx.createGain();
            triOsc.type = 'triangle';
            triOsc.frequency.setValueAtTime(frequency * 1.5, now);

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(6000, now);
            filter.Q.setValueAtTime(1 + neighborRatio * 12, now);

            const masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.25, now);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

            mainGain.gain.setValueAtTime(1 - (onRatio * 0.7), now);
            triGain.gain.setValueAtTime(onRatio * 0.5, now);

            mainOsc.connect(mainGain).connect(masterGain);
            triOsc.connect(triGain).connect(masterGain);
            masterGain.connect(filter).connect(audioCtx.destination);
            
            mainOsc.start(now);
            mainOsc.stop(now + 0.15);
            triOsc.start(now);
            triOsc.stop(now + 0.15);
        } else {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(frequency, now);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
            oscillator.connect(gainNode).connect(audioCtx.destination);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
        }
    }

    if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(freq, now + i * 0.12);
            gainNode.gain.setValueAtTime(0.25, now + i * 0.12);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.1);
            oscillator.connect(gainNode).connect(audioCtx.destination);
            oscillator.start(now + i * 0.12);
            oscillator.stop(now + i * 0.12 + 0.1);
        });
    }

    if (type === 'reset') {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        oscillator.connect(gainNode).connect(audioCtx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }
};

const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10M20 20l-1.5-1.5A9 9 0 013.5 14" />
  </svg>
);


const App: React.FC = () => {
    const [boardSize, setBoardSize] = useState<number>(3);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [board, setBoard] = useState<CellState[][]>(() => createSolvableBoard(boardSize, difficulty));
    const [moves, setMoves] = useState<number>(0);
    const [hasWon, setHasWon] = useState<boolean>(false);
    const [animateMoves, setAnimateMoves] = useState<boolean>(false);
    const [lastClick, setLastClick] = useState<{ row: number, col: number, key: number } | null>(null);

    // Reset Confirmation State
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
    const [pendingResetConfig, setPendingResetConfig] = useState<{size?: number, difficulty?: Difficulty} | null>(null);

    // Settings Menu State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Visual & Audio Settings
    const [themeName, setThemeName] = useState<ThemeName>(
        () => (localStorage.getItem('logicGridTheme') as ThemeName) || 'vibrant'
    );
    const [pulseEnabled, setPulseEnabled] = useState(true);
    const [winIntensity, setWinIntensity] = useState<WinIntensity>('normal');
    
    useEffect(() => {
        localStorage.setItem('logicGridTheme', themeName);
    }, [themeName]);
    const currentTheme = THEMES[themeName];

    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [waveform, setWaveform] = useState<Waveform>('sine');
    const [interactiveSound, setInteractiveSound] = useState<boolean>(true);
    
    const audioContextRef = useRef<AudioContext | null>(null);

    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser");
            }
        }
        const audioCtx = audioContextRef.current;
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }, []);

    const getSoundSettings = useCallback(() => ({
        enabled: soundEnabled,
        waveform,
        interactive: interactiveSound
    }), [soundEnabled, waveform, interactiveSound]);
    
    useEffect(() => {
        if (hasWon) {
            const audioCtx = initAudio();
            setTimeout(() => playSound('win', audioCtx, { soundSettings: getSoundSettings() }), 100);
        }
    }, [hasWon, initAudio, getSoundSettings]);

    useEffect(() => {
        if (moves > 0) {
            setAnimateMoves(true);
            const timer = setTimeout(() => setAnimateMoves(false), 300);
            return () => clearTimeout(timer);
        }
    }, [moves]);

    const handleCellClick = useCallback((row: number, col: number) => {
        if (hasWon) return;

        const audioCtx = initAudio();
        const newBoard = toggleCellAndNeighbors(row, col, board, boardSize);
        
        playSound('click', audioCtx, { board: newBoard, row, col, boardSize, soundSettings: getSoundSettings() });
        setMoves(prevMoves => prevMoves + 1);
        setLastClick({ row, col, key: Date.now() });

        const isWinningState = newBoard.flat().every(cell => !cell.isOn);
        if (isWinningState) {
            setBoard(newBoard);
            setHasWon(true);
            return;
        }

        setBoard(newBoard);
    }, [board, hasWon, boardSize, initAudio, getSoundSettings]);

    // Performs the actual reset
    const executeReset = (newSize?: number, newDifficulty?: Difficulty) => {
        const audioCtx = initAudio();
        playSound('reset', audioCtx, { soundSettings: getSoundSettings() });

        const sizeToUse = newSize || boardSize;
        const difficultyToUse = newDifficulty || difficulty;
        
        if (newSize && newSize !== boardSize) {
            setBoardSize(newSize);
        }
        if (newDifficulty && newDifficulty !== difficulty) {
            setDifficulty(newDifficulty);
        }
        setBoard(createSolvableBoard(sizeToUse, difficultyToUse));
        setMoves(0);
        setHasWon(false);

        // Clear confirmation states
        setShowResetConfirm(false);
        setPendingResetConfig(null);
    };

    // Public reset handler that checks if confirmation is needed
    const resetGame = (newSize?: number, newDifficulty?: Difficulty) => {
        // If the game is in progress (moves > 0) and is not already won, ask for confirmation
        if (moves > 0 && !hasWon) {
            setPendingResetConfig({ size: newSize, difficulty: newDifficulty });
            setShowResetConfirm(true);
        } else {
            executeReset(newSize, newDifficulty);
        }
    };

    const settingButtonClass = (isActive: boolean) =>
      `px-3 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200 ${
        isActive
          ? currentTheme.sizeButton.active
          : currentTheme.sizeButton.inactive
      }`;

    return (
        <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} flex flex-col items-center justify-center p-4 font-sans transition-colors duration-500`}>
            {/* Header Bar */}
            <div className="w-full max-w-md flex justify-between items-center mb-6">
                 <h1 className={`text-3xl sm:text-4xl font-bold ${currentTheme.header} tracking-tight`}>Logic Grid</h1>
                 <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Open Settings"
                 >
                    <MenuIcon className="w-8 h-8" />
                 </button>
            </div>
                
            <div className="w-full max-w-md mx-auto text-center flex-grow flex flex-col justify-center">
                <main className="flex flex-col items-center gap-4">
                    <GameBoard 
                        board={board} 
                        onCellClick={handleCellClick} 
                        isWon={hasWon} 
                        lastClick={lastClick} 
                        theme={currentTheme}
                        pulseEnabled={pulseEnabled}
                        winIntensity={winIntensity}
                    />
                    
                    {/* Status & Action Bar */}
                    <div className={`w-full flex justify-between items-center ${currentTheme.panel} backdrop-blur-sm p-4 rounded-xl shadow-md mt-4`}>
                        <div className="text-left flex-grow">
                             <div>
                                <span className={`${currentTheme.paragraph} text-sm`}>MOVES</span>
                                <p className={`text-2xl font-bold ${animateMoves ? 'move-counter-animate' : ''}`}>{moves}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => resetGame()}
                            className="flex-shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            <RefreshIcon className="w-5 h-5" />
                            Restart
                        </button>
                    </div>

                    {hasWon && (
                        <div className={`w-full p-4 ${currentTheme.winMessage} rounded-lg shadow-lg text-center win-message-animate`}>
                            <p className="font-bold text-xl">Congratulations!</p>
                            <p>You solved it in {moves} moves.</p>
                        </div>
                    )}
                </main>

                <footer className="mt-8 text-gray-500 text-sm">
                    <p>Click a square to flip it and its neighbors.</p>
                </footer>
            </div>

            {/* Settings Drawer */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-40 flex justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsSettingsOpen(false)}
                    />
                    
                    {/* Drawer Panel */}
                    <div className={`relative w-80 h-full ${currentTheme.bg} border-l border-white/10 shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-2xl font-bold ${currentTheme.header}`}>Settings</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded hover:bg-white/10">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-8 text-left">
                            {/* Game Configuration */}
                            <section>
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${currentTheme.paragraph}`}>Game Config</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm block mb-2 opacity-80">Grid Size</label>
                                        <div className="flex gap-2">
                                            {SIZES.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => resetGame(size)}
                                                    className={`flex-1 ${settingButtonClass(boardSize === size)}`}
                                                >
                                                    {size}x{size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm block mb-2 opacity-80">Difficulty</label>
                                        <div className="flex gap-2">
                                            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => resetGame(undefined, d)}
                                                    className={`flex-1 ${settingButtonClass(difficulty === d)}`}
                                                >
                                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-white/10" />

                            {/* Appearance */}
                            <section>
                                <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${currentTheme.paragraph}`}>Appearance</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm block mb-2 opacity-80">Theme</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(Object.keys(THEMES) as ThemeName[]).map(themeKey => (
                                                <button key={themeKey} onClick={() => setThemeName(themeKey)} className={settingButtonClass(themeName === themeKey)}>
                                                    {THEMES[themeKey].name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm opacity-80">Pulse Animation</label>
                                        <button onClick={() => setPulseEnabled(!pulseEnabled)} className={settingButtonClass(pulseEnabled)}>
                                            {pulseEnabled ? 'ON' : 'OFF'}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-sm block mb-2 opacity-80">Win Animation</label>
                                        <div className="flex gap-2">
                                            {(['low', 'normal', 'high'] as WinIntensity[]).map(intensity => (
                                                <button 
                                                    key={intensity} 
                                                    onClick={() => setWinIntensity(intensity)} 
                                                    className={`flex-1 ${settingButtonClass(winIntensity === intensity)}`}
                                                >
                                                    {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-white/10" />

                            {/* Sound */}
                            <section>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className={`text-sm font-bold uppercase tracking-wider ${currentTheme.paragraph}`}>Sound</h3>
                                    <button onClick={() => setSoundEnabled(!soundEnabled)} className={settingButtonClass(soundEnabled)}>
                                        {soundEnabled ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                {soundEnabled && (
                                    <div className="space-y-4 animate-fade-in-up">
                                        <div>
                                            <label className="text-sm block mb-2 opacity-80">Waveform</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['sine', 'square', 'sawtooth', 'triangle'] as Waveform[]).map(wave => (
                                                    <button key={wave} onClick={() => setWaveform(wave)} className={settingButtonClass(waveform === wave)}>
                                                        {wave.charAt(0).toUpperCase() + wave.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm opacity-80">Interactive Audio</label>
                                            <button onClick={() => setInteractiveSound(!interactiveSound)} className={settingButtonClass(interactiveSound)}>
                                                {interactiveSound ? 'ON' : 'OFF'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
                    <div 
                        className={`relative w-full max-w-sm p-6 rounded-xl shadow-2xl transform transition-all ${currentTheme.panel} border border-white/10`}
                        role="dialog"
                        aria-modal="true"
                    >
                        <h3 className={`text-xl font-bold mb-4 ${currentTheme.header}`}>Reset Game?</h3>
                        <p className={`mb-6 ${currentTheme.paragraph}`}>
                            Current progress will be lost. Are you sure you want to start over?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => {
                                    setShowResetConfirm(false);
                                    setPendingResetConfig(null);
                                }}
                                className={`px-4 py-2 rounded-lg ${currentTheme.paragraph} hover:text-white hover:bg-white/10 transition-colors`}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => executeReset(pendingResetConfig?.size, pendingResetConfig?.difficulty)}
                                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;