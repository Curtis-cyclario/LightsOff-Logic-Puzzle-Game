import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GameBoard from './components/GameBoard';

const SIZES = [3, 4, 5];
type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';
type Difficulty = 'easy' | 'medium' | 'hard';
export type WinIntensity = 'low' | 'normal' | 'high';

export type CellState = {
    isOn: boolean;
};

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
            active: 'bg-violet-600 text-white shadow-md shadow-violet-600/30',
            inactive: 'bg-slate-800 hover:bg-slate-700 text-gray-300'
        },
        panel: 'bg-slate-800/40 border border-white/5',
        winMessage: 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-300',
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
        bg: 'bg-gray-950',
        text: 'text-gray-100',
        header: 'text-white font-serif uppercase tracking-widest',
        paragraph: 'text-gray-500',
        sizeButton: {
            active: 'bg-white text-black shadow-md',
            inactive: 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        },
        panel: 'bg-gray-900/50 border border-white/5',
        winMessage: 'bg-gray-100/10 border border-gray-100/30 text-gray-100',
        cell: {
            schemes: [
                { bg: 'bg-white', shadow: 'shadow-gray-400/50', gradientFrom: 'from-white/70' },
                { bg: 'bg-gray-300', shadow: 'shadow-gray-500/50', gradientFrom: 'from-gray-300/70' },
                { bg: 'bg-gray-500', shadow: 'shadow-gray-600/50', gradientFrom: 'from-gray-500/70' },
            ],
            pathColors: ['#ffffff', '#d1d5db', '#9ca3af']
        }
    }
};

const toggleCellAndNeighbors = (row: number, col: number, currentBoard: CellState[][], boardSize: number): CellState[][] => {
    const newBoard = currentBoard.map(r => r.map(c => ({ ...c })));
    const toggle = (r: number, c: number) => {
        if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
            newBoard[r][c].isOn = !newBoard[r][c].isOn;
        }
    };
    toggle(row, col); toggle(row - 1, col); toggle(row + 1, col); toggle(row, col - 1); toggle(row, col + 1);
    return newBoard;
};

const createSolvableBoard = (boardSize: number, difficulty: Difficulty): CellState[][] => {
    let boardState: CellState[][] = Array(boardSize).fill(null).map(() => 
        Array(boardSize).fill(null).map(() => ({ isOn: false }))
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
    let scrambleMovesCount = difficulty === 'easy' ? Math.floor(boardSize * 1.5) : difficulty === 'hard' ? boardSize * boardSize : Math.floor(boardSize * 2.5);
    for (let i = 0; i < scrambleMovesCount; i++) {
        const randRow = Math.floor(Math.random() * boardSize);
        const randCol = Math.floor(Math.random() * boardSize);
        boardState = scrambleToggle(randRow, randCol, boardState);
    }
    if (boardState.flat().every(cell => !cell.isOn)) return createSolvableBoard(boardSize, difficulty);
    return boardState;
};

const STORAGE_KEYS = {
    THEME: 'logicGrid_theme',
    BEST_SCORES: 'logicGrid_bestScores',
    SOUND: 'logicGrid_soundEnabled',
    WAVEFORM: 'logicGrid_waveform',
    INTERACTIVE: 'logicGrid_interactiveSound',
    PULSE: 'logicGrid_pulseEnabled',
    INTENSITY: 'logicGrid_intensity',
    SAVED_GAME: 'logicGrid_savedGame'
};

const App: React.FC = () => {
    // Basic Game State
    const [boardSize, setBoardSize] = useState<number>(3);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [board, setBoard] = useState<CellState[][]>(() => Array(3).fill(null).map(() => Array(3).fill({ isOn: false })));
    const [history, setHistory] = useState<CellState[][][]>([]);
    const [moves, setMoves] = useState<number>(0);
    const [hasWon, setHasWon] = useState<boolean>(false);
    
    // UI Feedback
    const [animateMoves, setAnimateMoves] = useState<boolean>(false);
    const [lastClick, setLastClick] = useState<{ row: number, col: number, key: number } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
    const [pendingResetConfig, setPendingResetConfig] = useState<{size?: number, difficulty?: Difficulty} | null>(null);

    // Settings
    const [themeName, setThemeName] = useState<ThemeName>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeName) || 'vibrant');
    const [pulseEnabled, setPulseEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.PULSE) !== 'false');
    const [winIntensity, setWinIntensity] = useState<WinIntensity>(() => (localStorage.getItem(STORAGE_KEYS.INTENSITY) as WinIntensity) || 'normal');
    const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.SOUND) !== 'false');
    const [waveform, setWaveform] = useState<Waveform>(() => (localStorage.getItem(STORAGE_KEYS.WAVEFORM) as Waveform) || 'sine');
    const [interactiveSound, setInteractiveSound] = useState(() => localStorage.getItem(STORAGE_KEYS.INTERACTIVE) !== 'false');

    // Stats
    const [bestScores, setBestScores] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.BEST_SCORES);
        return saved ? JSON.parse(saved) : {};
    });

    const currentTheme = THEMES[themeName];
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initial Load Persistence
    useEffect(() => {
        const savedGame = localStorage.getItem(STORAGE_KEYS.SAVED_GAME);
        if (savedGame) {
            const data = JSON.parse(savedGame);
            setBoard(data.board);
            setMoves(data.moves);
            setBoardSize(data.boardSize);
            setDifficulty(data.difficulty);
            setHistory(data.history || []);
            setHasWon(data.hasWon);
        } else {
            setBoard(createSolvableBoard(3, 'medium'));
        }
    }, []);

    // Save Game State
    useEffect(() => {
        if (!hasWon) {
            localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify({
                board, moves, boardSize, difficulty, history, hasWon
            }));
        } else {
            localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
        }
    }, [board, moves, boardSize, difficulty, history, hasWon]);

    // Save Settings
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.THEME, themeName);
        localStorage.setItem(STORAGE_KEYS.PULSE, String(pulseEnabled));
        localStorage.setItem(STORAGE_KEYS.INTENSITY, winIntensity);
        localStorage.setItem(STORAGE_KEYS.SOUND, String(soundEnabled));
        localStorage.setItem(STORAGE_KEYS.WAVEFORM, waveform);
        localStorage.setItem(STORAGE_KEYS.INTERACTIVE, String(interactiveSound));
    }, [themeName, pulseEnabled, winIntensity, soundEnabled, waveform, interactiveSound]);

    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) { console.error("Audio API error", e); }
        }
        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
        return audioContextRef.current;
    }, []);

    const playSoundEffect = useCallback((type: 'click' | 'win' | 'reset', row?: number, col?: number) => {
        if (!soundEnabled) return;
        const ctx = initAudio();
        if (!ctx) return;
        const now = ctx.currentTime;
        
        if (type === 'click' && row !== undefined && col !== undefined) {
            const pentatonic = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25, 739.99];
            const index = Math.floor(((row * boardSize + col) / (boardSize * boardSize)) * pentatonic.length);
            const freq = pentatonic[index % pentatonic.length];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = waveform;
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            osc.connect(gain).connect(ctx.destination);
            osc.start(); osc.stop(now + 0.2);
        } else if (type === 'win') {
            [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + i * 0.1);
                gain.gain.setValueAtTime(0.1, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.3);
                osc.connect(gain).connect(ctx.destination);
                osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.3);
            });
        } else if (type === 'reset') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
            osc.connect(gain).connect(ctx.destination);
            osc.start(); osc.stop(now + 0.2);
        }
    }, [soundEnabled, waveform, boardSize, initAudio]);

    const handleCellClick = useCallback((row: number, col: number) => {
        if (hasWon) return;
        setHistory(prev => [...prev, board.map(r => r.map(c => ({...c})))].slice(-20));
        const newBoard = toggleCellAndNeighbors(row, col, board, boardSize);
        setBoard(newBoard);
        setMoves(m => m + 1);
        setLastClick({ row, col, key: Date.now() });
        setAnimateMoves(true);
        setTimeout(() => setAnimateMoves(false), 300);
        playSoundEffect('click', row, col);

        if (newBoard.flat().every(cell => !cell.isOn)) {
            setHasWon(true);
            playSoundEffect('win');
            const key = `${boardSize}-${difficulty}`;
            const currentBest = bestScores[key];
            if (!currentBest || moves + 1 < currentBest) {
                const newBest = { ...bestScores, [key]: moves + 1 };
                setBestScores(newBest);
                localStorage.setItem(STORAGE_KEYS.BEST_SCORES, JSON.stringify(newBest));
            }
        }
    }, [board, boardSize, hasWon, moves, bestScores, difficulty, playSoundEffect]);

    const undo = useCallback(() => {
        if (history.length === 0 || hasWon) return;
        const previous = history[history.length - 1];
        setBoard(previous);
        setHistory(prev => prev.slice(0, -1));
        setMoves(m => Math.max(0, m - 1));
        playSoundEffect('reset');
    }, [history, hasWon, playSoundEffect]);

    const executeReset = (newSize?: number, newDifficulty?: Difficulty) => {
        const sizeToUse = newSize || boardSize;
        const difficultyToUse = newDifficulty || difficulty;
        setBoardSize(sizeToUse);
        setDifficulty(difficultyToUse);
        setBoard(createSolvableBoard(sizeToUse, difficultyToUse));
        setMoves(0);
        setHasWon(false);
        setHistory([]);
        setShowResetConfirm(false);
        setPendingResetConfig(null);
        playSoundEffect('reset');
    };

    const resetGame = (newSize?: number, newDifficulty?: Difficulty) => {
        if (moves > 0 && !hasWon) {
            setPendingResetConfig({ size: newSize, difficulty: newDifficulty });
            setShowResetConfirm(true);
        } else {
            executeReset(newSize, newDifficulty);
        }
    };

    const currentBestKey = `${boardSize}-${difficulty}`;
    const currentBestScore = bestScores[currentBestKey];

    return (
        <div className={`fixed inset-0 overflow-hidden ${currentTheme.bg} ${currentTheme.text} flex flex-col items-center p-4 font-sans select-none transition-colors duration-700`}>
            {/* Nav */}
            <header className="w-full max-w-md flex justify-between items-center mt-2 mb-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className={`text-2xl font-black uppercase tracking-tighter ${currentTheme.header}`}>Logic Grid</h1>
                 </div>
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                 </button>
            </header>

            <main className="w-full max-w-md flex-grow flex flex-col items-center justify-center gap-6 overflow-y-auto pb-8">
                <GameBoard 
                    board={board} onCellClick={handleCellClick} isWon={hasWon} 
                    lastClick={lastClick} theme={currentTheme} pulseEnabled={pulseEnabled} 
                    winIntensity={winIntensity}
                />

                <div className={`w-full ${currentTheme.panel} backdrop-blur-md p-5 rounded-2xl shadow-xl flex items-center gap-6`}>
                    <div className="flex-grow">
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest block mb-1">Moves</span>
                        <div className={`text-3xl font-black tabular-nums ${animateMoves ? 'move-counter-animate' : ''}`}>
                            {moves}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button 
                            disabled={history.length === 0 || hasWon}
                            onClick={undo}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:scale-100 active:scale-90 transition-all"
                            title="Undo"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => resetGame()}
                            className="p-3 rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:brightness-110 active:scale-95 transition-all"
                            title="Restart"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 10M20 20l-1.5-1.5A9 9 0 013.5 14" />
                            </svg>
                        </button>
                    </div>
                </div>

                {hasWon && (
                    <div className={`w-full p-6 ${currentTheme.winMessage} rounded-2xl shadow-2xl win-message-animate flex flex-col items-center gap-2`}>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Victorious!</h2>
                        <div className="text-sm opacity-80">
                            {currentBestScore === moves ? (
                                <span className="flex items-center gap-1 font-bold text-yellow-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    New Personal Best
                                </span>
                            ) : `Solved in ${moves} moves.`}
                        </div>
                        <button 
                            onClick={() => resetGame()} 
                            className="mt-2 text-xs font-bold uppercase tracking-widest underline underline-offset-4 decoration-2 hover:opacity-70 transition-opacity"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </main>

            {/* Sidebar Settings Drawer */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm backdrop-fade" onClick={() => setIsSettingsOpen(false)} />
                    <aside className={`relative w-80 h-full ${currentTheme.bg} border-l border-white/10 shadow-2xl p-6 drawer-animate flex flex-col`}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Config</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-white/5 rounded-lg">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-10 overflow-y-auto pr-2 pb-8">
                            <section>
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 block">Level Setup</label>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center text-xs mb-2">
                                            <span className="opacity-60">Board Density</span>
                                            <span className="font-bold">{boardSize}x{boardSize}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {SIZES.map(s => (
                                                <button key={s} onClick={() => resetGame(s)} className={`py-2 rounded-xl text-xs font-bold transition-all ${boardSize === s ? currentTheme.sizeButton.active : currentTheme.sizeButton.inactive}`}>
                                                    {s}x{s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-60 mb-2">Complexity</div>
                                        <div className="flex gap-2">
                                            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                                                <button key={d} onClick={() => resetGame(undefined, d)} className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${difficulty === d ? currentTheme.sizeButton.active : currentTheme.sizeButton.inactive}`}>
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 block">Atmosphere</label>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        {(Object.keys(THEMES) as ThemeName[]).map(t => (
                                            <button key={t} onClick={() => setThemeName(t)} className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${themeName === t ? currentTheme.sizeButton.active : currentTheme.sizeButton.inactive}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-xl">
                                        <span className="text-xs opacity-60 font-bold uppercase tracking-wider">Pulse FX</span>
                                        <button onClick={() => setPulseEnabled(!pulseEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${pulseEnabled ? 'bg-violet-600' : 'bg-white/10'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pulseEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 block">Audio Core</label>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-xl">
                                        <span className="text-xs opacity-60 font-bold uppercase tracking-wider">Sound Engine</span>
                                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-violet-600' : 'bg-white/10'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {soundEnabled && (
                                        <div className="grid grid-cols-2 gap-2 animate-fade-in-up">
                                            {(['sine', 'square', 'sawtooth', 'triangle'] as Waveform[]).map(w => (
                                                <button key={w} onClick={() => setWaveform(w)} className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${waveform === w ? currentTheme.sizeButton.active : currentTheme.sizeButton.inactive}`}>
                                                    {w}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {currentBestScore && (
                                <section className="pt-4 border-t border-white/5">
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Personal Records</div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="opacity-60">{boardSize}x{boardSize} {difficulty}</span>
                                        <span className="font-black text-violet-400">{currentBestScore} Moves</span>
                                    </div>
                                </section>
                            )}
                        </div>
                        
                        <div className="mt-auto pt-4 text-[10px] opacity-20 uppercase tracking-[0.2em] text-center">Logic Grid v1.0.1</div>
                    </aside>
                </div>
            )}

            {showResetConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                    <div className={`${currentTheme.panel} w-full max-w-xs p-6 rounded-3xl shadow-2xl animate-fade-in-up`}>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">Reset Level?</h3>
                        <p className="text-sm opacity-60 mb-6">Your current sequence will be discarded. Continue?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">Abort</button>
                            <button onClick={() => executeReset(pendingResetConfig?.size, pendingResetConfig?.difficulty)} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-600/30">Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;