import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, 
  Shield, 
  Skull, 
  Swords, 
  UserPlus, 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw, 
  ChevronRight,
  Droplet,
  Menu,
  X,
  Zap,
  Home,
  Gem, 
  Undo2,
  Sparkles,
  Sun,
  Cloud,
  Moon,
  Flame,
  Trees,
  Hexagon,
  MoreHorizontal,
  Database, 
  Users,
  History,
  Trophy, 
  Save,   
  LogOut,  
  ScrollText,
  BarChart3, 
  ArrowLeft,
  AlertTriangle,
  Clock,
  Hourglass,
  Settings
} from 'lucide-react';

// --- Utility Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg text-sm md:text-base relative overflow-hidden group";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-50 border border-slate-600",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-red-900/30",
    success: "bg-green-600 hover:bg-green-500 text-white shadow-green-900/30",
    ghost: "bg-transparent hover:bg-white/10 text-slate-300 shadow-none hover:text-white",
    icon: "p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white aspect-square border border-slate-700"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12 pointer-events-none" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-xl ${className}`}>
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, zIndex = "z-50" }) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200`}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85dvh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950/50 z-10 shrink-0">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function CommanderApp() {
  // --- State: Data (Persisted) ---
  const [storedPlayers, setStoredPlayers] = useState(() => {
    const saved = localStorage.getItem('mtg_players');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', name: 'Chandra' }, 
      { id: 'p2', name: 'Jace' },
      { id: 'p3', name: 'Liliana' },
      { id: 'p4', name: 'Ajani' }
    ];
  });

  const [storedDecks, setStoredDecks] = useState(() => {
    const saved = localStorage.getItem('mtg_decks');
    return saved ? JSON.parse(saved) : [
      { id: 'd1', commander: 'Atraxa', owner: 'p1' },
      { id: 'd2', commander: 'Ur-Dragon', owner: 'p2' }
    ];
  });

  const [matchHistory, setMatchHistory] = useState(() => {
    const saved = localStorage.getItem('mtg_match_history');
    return saved ? JSON.parse(saved) : [];
  });

  // --- State: UI & Setup ---
  const [view, setView] = useState('SETUP');
  const [numPlayers, setNumPlayers] = useState(4);
  const [setupSlots, setSetupSlots] = useState({});
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [historyListOpen, setHistoryListOpen] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newDeckCommander, setNewDeckCommander] = useState('');
  const [newDeckOwner, setNewDeckOwner] = useState('');

  const [statsPlayerId, setStatsPlayerId] = useState(null); 

  // --- State: Active Game ---
  const [gameState, setGameState] = useState({
    turnCount: 1,
    activePlayerIndex: 0,
    startingPlayerIndex: 0,
    startTime: 0, 
    currentTurnStartTime: 0,
    players: [], 
    history: [] 
  });

  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false); 
  const [gameLogOpen, setGameLogOpen] = useState(false); 
  const [playerOverlays, setPlayerOverlays] = useState({});
  const [playerMenus, setPlayerMenus] = useState({});
  const [tapFeedback, setTapFeedback] = useState({}); 
  const [winner, setWinner] = useState(null); 
  
  const [isPortrait, setIsPortrait] = useState(false);

  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  
  const turnButtonTimer = useRef(null);
  const isTurnButtonLongPress = useRef(false);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('mtg_players', JSON.stringify(storedPlayers));
  }, [storedPlayers]);

  useEffect(() => {
    localStorage.setItem('mtg_decks', JSON.stringify(storedDecks));
  }, [storedDecks]);

  useEffect(() => {
    localStorage.setItem('mtg_match_history', JSON.stringify(matchHistory));
  }, [matchHistory]);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    if (view === 'GAME' && gameState.players.length > 0 && !winner) {
      const alivePlayers = gameState.players.filter(p => !p.isDead);
      if (alivePlayers.length === 1 && gameState.players.length > 1) {
        setWinner(alivePlayers[0]);
      }
    }
  }, [gameState.players, view, winner]);

  // --- Helpers ---
  const formatDuration = (ms) => {
    if (!ms) return '-';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const formatTurnTime = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  // --- Stats Calculation Logic ---
  const calculateStats = (playerId) => {
    const player = storedPlayers.find(p => p.id === playerId) || { name: 'Sconosciuto' };
    let totalGames = 0;
    let totalWins = 0;
    let totalTurnTime = 0;
    let totalRecordedTurns = 0;
    const commanderStats = {}; 

    matchHistory.forEach(match => {
      const participation = match.players.find(p => p.originalId === playerId);
      
      if (participation) {
        totalGames++;
        const deck = participation.deckName || 'Unknown';
        
        if (!commanderStats[deck]) {
          commanderStats[deck] = { played: 0, won: 0 };
        }
        commanderStats[deck].played++;

        if (match.winnerOriginalId === playerId) {
          totalWins++;
          commanderStats[deck].won++;
        }

        if (participation.avgTurnTime) {
          totalTurnTime += participation.avgTurnTime;
          totalRecordedTurns++;
        }
      }
    });

    const globalAvgTurnTime = totalRecordedTurns > 0 ? totalTurnTime / totalRecordedTurns : 0;

    const topCommanders = Object.entries(commanderStats)
      .map(([name, stats]) => {
        const deckInLib = storedDecks.find(d => d.commander === name);
        const ownerName = deckInLib ? storedPlayers.find(p => p.id === deckInLib.owner)?.name : null;

        return {
          name,
          ownerName,
          ...stats,
          winRate: stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0
        };
      })
      .sort((a, b) => b.winRate - a.winRate || b.played - a.played)
      .slice(0, 3);

    return {
      name: player.name,
      totalGames,
      totalWins,
      winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
      globalAvgTurnTime,
      topCommanders
    };
  };

  // --- Actions: Data Management ---
  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newId = `p${Date.now()}`;
    setStoredPlayers([...storedPlayers, { id: newId, name: newPlayerName }]);
    setNewPlayerName('');
  };

  const addDeck = () => {
    if (!newDeckCommander.trim() || !newDeckOwner) return;
    const newId = `d${Date.now()}`;
    setStoredDecks([...storedDecks, { id: newId, commander: newDeckCommander, owner: newDeckOwner }]);
    setNewDeckCommander('');
    setNewDeckOwner('');
  };

  const requestDeletePlayer = (id) => setItemToDelete({ type: 'player', id });
  const requestDeleteDeck = (id) => setItemToDelete({ type: 'deck', id });

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'player') {
      setStoredPlayers(storedPlayers.filter(p => p.id !== itemToDelete.id));
    } else {
      setStoredDecks(storedDecks.filter(d => d.id !== itemToDelete.id));
    }
    setItemToDelete(null);
  };

  const handleSlotChange = (index, field, value) => {
    setSetupSlots(prev => ({
      ...prev,
      [index]: { ...prev[index], [field]: value }
    }));
  };

  const isSetupValid = () => {
    if (Object.keys(setupSlots).length < numPlayers) return false;
    for (let i = 0; i < numPlayers; i++) {
      if (!setupSlots[i]?.playerId || !setupSlots[i]?.deckId) return false;
    }
    const selectedPlayers = Object.values(setupSlots).map(s => s.playerId);
    const uniquePlayers = new Set(selectedPlayers);
    if (selectedPlayers.length !== uniquePlayers.size) return false;

    return true;
  };

  const getInitialMana = () => ({ w: 0, u: 0, b: 0, r: 0, g: 0, c: 0 });

  const initGame = (players) => {
    const startIndex = Math.floor(Math.random() * players.length);
    setPlayerOverlays({}); 
    setPlayerMenus({});
    setWinner(null);

    const now = Date.now();

    setGameState({
      turnCount: 1,
      activePlayerIndex: startIndex,
      startingPlayerIndex: startIndex,
      startTime: now, 
      currentTurnStartTime: now,
      players: players,
      history: []
    });
    setView('GAME');
  };

  const startGenericGame = () => {
    const players = Array.from({ length: 4 }).map((_, i) => ({
      gameId: i,
      originalId: `gen${i}`,
      name: `Giocatore ${i + 1}`,
      deckName: `Commander ${i + 1}`,
      life: 40,
      poison: 0,
      commanderTax: 0, 
      mana: getInitialMana(),
      activeCounter: 'poison', 
      commanderDamage: {},
      isDead: false,
      deathReason: null,
      color: generateColor(i),
      turnTimes: []
    }));
    initGame(players);
  };

  const startGame = () => {
    const players = [];
    for (let i = 0; i < numPlayers; i++) {
      const slot = setupSlots[i];
      const pData = storedPlayers.find(p => p.id === slot.playerId);
      const dData = storedDecks.find(d => d.id === slot.deckId);
      
      players.push({
        gameId: i,
        originalId: pData.id,
        name: pData.name,
        deckName: dData.commander,
        life: 40,
        poison: 0,
        commanderTax: 0,
        mana: getInitialMana(),
        activeCounter: 'poison', 
        commanderDamage: {},
        isDead: false,
        deathReason: null,
        color: generateColor(i),
        turnTimes: []
      });
    }
    initGame(players);
  };

  const saveMatch = () => {
    if (!winner) return;

    const duration = Date.now() - gameState.startTime;

    const newMatch = {
      id: Date.now(),
      date: new Date().toISOString(),
      duration: duration,
      players: gameState.players.map(p => {
        const validTurns = p.turnTimes || [];
        const avgTime = validTurns.length > 0 
          ? validTurns.reduce((a, b) => a + b, 0) / validTurns.length 
          : 0;

        return {
          name: p.name,
          deckName: p.deckName,
          gameId: p.gameId,
          originalId: p.originalId,
          avgTurnTime: avgTime
        };
      }),
      winnerId: winner.gameId,
      winnerOriginalId: winner.originalId, 
      turns: gameState.turnCount
    };

    setMatchHistory([newMatch, ...matchHistory]);
    setView('SETUP');
    setWinner(null);
  };

  const exitMatch = () => {
    if (confirm('Sicuro di voler uscire senza salvare?')) {
      setView('SETUP');
      setWinner(null);
    }
  };

  const logLifeChange = (prevHistory, gameId, diff, currentTurn) => {
    const now = Date.now();
    const lastEntry = prevHistory[prevHistory.length - 1];

    if (
      lastEntry && 
      lastEntry.playerId === gameId && 
      lastEntry.turn === currentTurn && 
      (now - lastEntry.timestamp < 5000)
    ) {
      const newHistory = [...prevHistory];
      newHistory[newHistory.length - 1] = {
        ...lastEntry,
        diff: lastEntry.diff + diff,
        timestamp: now
      };
      return newHistory;
    } else {
      return [...prevHistory, {
        turn: currentTurn,
        playerId: gameId,
        diff: diff,
        timestamp: now
      }];
    }
  };

  const changePlayerLife = (gameId, diff) => {
    setGameState(prev => {
      const newPlayers = prev.players.map(p => {
        if (p.gameId === gameId) {
          const updated = { ...p, life: p.life + diff };
          return checkDeath(updated);
        }
        return p;
      });
      const newHistory = logLifeChange(prev.history, gameId, diff, prev.turnCount);
      return { ...prev, players: newPlayers, history: newHistory };
    });
  };

  const checkDeath = (player) => {
    if (player.isDead) return player;
    let dead = false;
    let reason = null;
    if (player.life <= 0) { dead = true; reason = "Vita esaurita"; } 
    else if (player.poison >= 10) { dead = true; reason = "Veleno"; } 
    else if (Object.values(player.commanderDamage).some(d => d >= 21)) { dead = true; reason = "Danno Comandante"; }

    if (dead) return { ...player, isDead: true, deathReason: reason };
    return player;
  };

  const updatePlayer = (gameId, updater) => {
    setGameState(prev => {
      const newPlayers = prev.players.map(p => {
        if (p.gameId === gameId) {
          const updated = updater(p);
          return checkDeath(updated);
        }
        return p;
      });
      return { ...prev, players: newPlayers };
    });
  };

  const resurrectPlayer = (gameId) => {
    setGameState(prev => {
      const newPlayers = prev.players.map(p => {
        if (p.gameId === gameId) return { ...p, isDead: false, deathReason: null };
        return p;
      });
      return { ...prev, players: newPlayers };
    });
    if (winner) setWinner(null);
  };

  const togglePlayerCounter = (gameId) => {
    updatePlayer(gameId, p => ({
      ...p,
      activeCounter: p.activeCounter === 'poison' ? 'tax' : 'poison'
    }));
  };

  const setOverlay = (gameId, type) => {
    setPlayerOverlays(prev => ({
      ...prev,
      [gameId]: prev[gameId] === type ? null : type 
    }));
  };

  const togglePlayerMenu = (gameId) => {
    setPlayerMenus(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  const nextTurn = () => {
    setGameState(prev => {
      const now = Date.now();
      
      const turnDuration = now - prev.currentTurnStartTime;
      
      const updatedPlayers = prev.players.map((p, i) => {
        if (i === prev.activePlayerIndex) {
          const newPlayerState = { 
              ...p, 
              mana: getInitialMana() 
          };

          if (prev.turnCount >= 3) {
            newPlayerState.turnTimes = [...(p.turnTimes || []), turnDuration];
          }
          
          return newPlayerState;
        }
        return p;
      });

      let nextIndex = (prev.activePlayerIndex + 1) % prev.players.length;
      let loopCount = 0;
      
      while (prev.players[nextIndex].isDead && loopCount < prev.players.length) {
        nextIndex = (nextIndex + 1) % prev.players.length;
        loopCount++;
      }

      if (loopCount === prev.players.length) return prev;

      const N = prev.players.length;
      const start = prev.startingPlayerIndex;
      const currentRel = (prev.activePlayerIndex - start + N) % N;
      const nextRel = (nextIndex - start + N) % N;

      const newTurnCount = nextRel < currentRel ? prev.turnCount + 1 : prev.turnCount;

      return {
        ...prev,
        players: updatedPlayers,
        activePlayerIndex: nextIndex,
        turnCount: newTurnCount,
        currentTurnStartTime: now
      };
    });
  };

  const handlePointerDown = (e, gameId, side) => {
    isLongPress.current = false;
    setTapFeedback(prev => ({ ...prev, [gameId]: side }));

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      changePlayerLife(gameId, side === 'right' ? 10 : -10);
      if (navigator.vibrate) navigator.vibrate(50);
      setTapFeedback(prev => ({ ...prev, [gameId]: null }));
    }, 500);
  };

  const handlePointerUp = (e, gameId, side) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isLongPress.current) {
      changePlayerLife(gameId, side === 'right' ? 1 : -1);
    }
    setTapFeedback(prev => ({ ...prev, [gameId]: null }));
  };

  const handlePointerLeave = (e, gameId) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setTapFeedback(prev => ({ ...prev, [gameId]: null }));
  };

  const handleTurnButtonDown = (e) => {
    e.preventDefault(); 
    isTurnButtonLongPress.current = false;
    
    turnButtonTimer.current = setTimeout(() => {
      isTurnButtonLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
      setGameMenuOpen(true);
    }, 1000); 
  };

  const handleTurnButtonUp = (e) => {
    e.preventDefault();
    if (turnButtonTimer.current) {
      clearTimeout(turnButtonTimer.current);
      turnButtonTimer.current = null;
    }

    if (!isTurnButtonLongPress.current) {
      nextTurn();
    }
    isTurnButtonLongPress.current = false;
  };

  const handleTurnButtonLeave = (e) => {
    if (turnButtonTimer.current) {
      clearTimeout(turnButtonTimer.current);
      turnButtonTimer.current = null;
    }
    isTurnButtonLongPress.current = false;
  };

  const generateColor = (index) => {
    const colors = [
      'from-red-900 to-red-950',
      'from-blue-900 to-blue-950',
      'from-green-900 to-green-950',
      'from-slate-800 to-slate-950',
      'from-amber-700 to-amber-900',
      'from-purple-900 to-purple-950',
    ];
    return colors[index % colors.length];
  };

  const MANA_TYPES = [
    { key: 'w', color: 'bg-yellow-200/20 text-yellow-100 border-yellow-500/50', icon: Sun },
    { key: 'u', color: 'bg-blue-500/20 text-blue-100 border-blue-500/50', icon: Droplet }, 
    { key: 'b', color: 'bg-purple-950/40 text-purple-100 border-purple-500/50', icon: Skull }, 
    { key: 'r', color: 'bg-red-500/20 text-red-100 border-red-500/50', icon: Flame },
    { key: 'g', color: 'bg-green-500/20 text-green-100 border-green-500/50', icon: Trees },
    { key: 'c', color: 'bg-slate-500/20 text-slate-100 border-slate-500/50', icon: Hexagon }, 
  ];

  const getGridClass = (count) => {
    switch(count) {
      case 2: return 'grid-cols-2'; 
      case 3: return 'grid-cols-3'; 
      case 4: return 'grid-cols-2 grid-rows-2'; 
      case 5: return 'grid-cols-3 grid-rows-2'; 
      case 6: return 'grid-cols-3 grid-rows-2';
      default: return 'grid-cols-2';
    }
  };

  const getCellSpanClass = (index, totalPlayers) => {
    if (totalPlayers === 3 && index === 2) return '';
    if (totalPlayers === 5 && index === 2) return 'row-span-2';
    return '';
  };

  const getRotationClass = (index, totalPlayers) => {
    switch(totalPlayers) {
      case 2:
        if (index === 0) return 'rotate-90';
        if (index === 1) return '-rotate-90';
        return '';
      case 3:
        if (index === 0) return 'rotate-90';
        if (index === 1) return 'rotate-180';
        if (index === 2) return '-rotate-90';
        return '';
      case 4:
        if (index === 0 || index === 1) return 'rotate-180';
        return ''; 
      case 5:
        if (index === 0 || index === 1) return 'rotate-180';
        if (index === 2) return '-rotate-90'; 
        return ''; 
      case 6:
        if (index < 3) return 'rotate-180';
        return ''; 
      default:
        return '';
    }
  };

  // --- MAIN RENDER ---

  const containerStyle = (view === 'GAME' && isPortrait) ? {
    width: '100vh',
    height: '100vw',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(90deg)',
    overflow: 'hidden'
  } : {
    width: '100%',
    height: '100vh',
    overflow: 'hidden'
  };

  // --- SETUP VIEW ---
  if (view === 'SETUP') {
    return (
      <div className="bg-slate-950 text-slate-100 font-sans fixed inset-0 overflow-hidden flex flex-col h-[100dvh] w-[100dvw]">
        
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

        <div className="relative p-4 flex items-center justify-between bg-slate-900/50 border-b border-slate-800 shrink-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
               Commander Tracker
             </h1>
          </div>
          <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setStatsPlayerId(null); setHistoryListOpen(true); }} className="p-2">
                  <ScrollText size={24} className="text-slate-400 hover:text-indigo-400" />
              </Button>
              <Button variant="ghost" onClick={() => setLibraryOpen(true)} className="p-2">
                  <Database size={24} className="text-indigo-400" />
              </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 pb-24 overscroll-contain">
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Giocatori</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setNumPlayers(Math.max(2, numPlayers - 1))} className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xl font-bold">-</button>
                  <span className="font-mono font-bold text-3xl text-indigo-400">{numPlayers}</span>
                  <button onClick={() => setNumPlayers(Math.min(6, numPlayers + 1))} className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xl font-bold">+</button>
                </div>
             </div>
             <div className="flex-1">
                <button 
                  onClick={startGenericGame}
                  className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 hover:from-indigo-900/50 hover:to-slate-900 border border-indigo-500/20 hover:border-indigo-500/50 rounded-xl p-4 flex flex-row md:flex-col items-center justify-center gap-3 transition-all group min-h-[100px]"
                >
                  <Zap size={32} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left md:text-center">
                    <span className="font-bold text-lg text-slate-200 block">Partita Veloce</span>
                    <span className="text-xs text-slate-500 block">4 Player Generici</span>
                  </div>
                </button>
             </div>
          </div>

          <div className="space-y-3">
            {Array.from({ length: numPlayers }).map((_, idx) => (
              <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select 
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors appearance-none"
                      value={setupSlots[idx]?.playerId || ''}
                      onChange={(e) => handleSlotChange(idx, 'playerId', e.target.value)}
                    >
                      <option value="">Seleziona Giocatore...</option>
                      {storedPlayers.map(p => (
                        <option key={p.id} value={p.id} disabled={Object.values(setupSlots).some(s => s.playerId === p.id && s !== setupSlots[idx])}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors appearance-none"
                      value={setupSlots[idx]?.deckId || ''}
                      onChange={(e) => handleSlotChange(idx, 'deckId', e.target.value)}
                    >
                      <option value="">Seleziona Mazzo...</option>
                      {storedDecks.map(d => (
                        <option key={d.id} value={d.id} disabled={Object.values(setupSlots).some(s => s.deckId === d.id && s !== setupSlots[idx])}>{d.commander}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 sticky bottom-0 z-30">
          <Button 
            onClick={startGame} 
            disabled={!isSetupValid()} 
            className={`w-full py-4 text-lg rounded-xl shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 ${
              isSetupValid() 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-900/30 border border-green-500/30' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Swords size={20} className={isSetupValid() ? "animate-pulse" : ""} />
            INIZIA PARTITA
          </Button>
        </div>

        <Modal isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} title="Libreria">
             <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Nuovi Giocatori</h4>
                <div className="flex gap-2 mb-3">
                  <input type="text" placeholder="Nome..." className="bg-slate-900 border border-slate-700 rounded px-3 py-2 flex-1 text-sm outline-none" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} />
                  <Button variant="secondary" onClick={addPlayer} className="py-1 px-3"><Plus size={16}/></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {storedPlayers.map(p => (
                    <div key={p.id} className="bg-slate-800 px-2 py-1 rounded text-[10px] flex items-center gap-1 border border-slate-700">
                      {p.name} <button onClick={() => requestDeletePlayer(p.id)} className="text-red-400 hover:text-red-300"><X size={10}/></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-800"></div>
              <div>
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Nuovi Mazzi</h4>
                <div className="space-y-2 mb-3">
                  <input type="text" placeholder="Comandante..." className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm outline-none" value={newDeckCommander} onChange={(e) => setNewDeckCommander(e.target.value)} />
                  <div className="flex gap-2">
                    <select className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 outline-none text-sm" value={newDeckOwner} onChange={(e) => setNewDeckOwner(e.target.value)}>
                      <option value="">Proprietario...</option>
                      {storedPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Button variant="secondary" onClick={addDeck} disabled={!newDeckOwner} className="py-1 px-3"><Plus size={16}/></Button>
                  </div>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {storedDecks.map(d => (
                    <div key={d.id} className="bg-slate-800 px-3 py-2 rounded text-[10px] flex items-center justify-between border border-slate-700">
                      <span>{d.commander} <span className="text-slate-500">({storedPlayers.find(p => p.id === d.owner)?.name})</span></span>
                      <button onClick={() => requestDeleteDeck(d.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </Modal>

        {itemToDelete && (
            <Modal isOpen={true} onClose={() => setItemToDelete(null)} title="Conferma Eliminazione" zIndex="z-[60]">
              <div className="flex flex-col gap-6 text-center pt-4 pb-2">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">Sei sicuro?</h4>
                  <p className="text-slate-400 text-sm">
                    Stai per eliminare definitivamente questo {itemToDelete.type === 'player' ? 'giocatore' : 'mazzo'}.<br/>
                    L'azione è irreversibile.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button variant="secondary" onClick={() => setItemToDelete(null)} className="justify-center">Annulla</Button>
                  <Button variant="danger" onClick={confirmDelete} className="justify-center bg-red-600 hover:bg-red-500">Elimina Definitivamente</Button>
                </div>
              </div>
            </Modal>
        )}

        <Modal 
            isOpen={historyListOpen} 
            onClose={() => { setHistoryListOpen(false); setStatsPlayerId(null); }} 
            title={statsPlayerId ? "Statistiche Giocatore" : "Storico Partite"}
          >
            {statsPlayerId ? (
              (() => {
                const stats = calculateStats(statsPlayerId);
                return (
                  <div className="space-y-6 animate-in slide-in-from-right duration-200">
                    <button onClick={() => setStatsPlayerId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-2">
                      <ArrowLeft size={16} /> Torna indietro
                    </button>
                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 text-center">
                      <h2 className="text-3xl font-bold text-indigo-200 mb-1">{stats.name}</h2>
                      <div className="flex justify-center gap-8 mt-4 border-b border-slate-700 pb-4">
                        <div className="flex flex-col"><span className="text-3xl font-black text-white">{stats.winRate}%</span><span className="text-xs text-slate-400 uppercase tracking-wider">Win Rate</span></div>
                        <div className="flex flex-col border-l border-slate-700 pl-8"><span className="text-3xl font-black text-white">{stats.totalWins}/{stats.totalGames}</span><span className="text-xs text-slate-400 uppercase tracking-wider">Vittorie</span></div>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-2 text-amber-400">
                        <Hourglass size={16} />
                        <span className="font-mono font-bold text-lg">{formatTurnTime(stats.globalAvgTurnTime)}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider ml-1">Media Turno (3+)</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Top Commander</h4>
                      <div className="space-y-2">
                        {stats.topCommanders.length === 0 ? <p className="text-slate-500 text-xs italic">Nessun dato disponibile.</p> : stats.topCommanders.map((cmd, idx) => (
                            <div key={idx} className="bg-slate-800 p-3 rounded-xl flex items-center justify-between border border-slate-700">
                              <div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{idx + 1}</div><span className="font-bold text-slate-200 text-sm">{cmd.name} {cmd.ownerName && <span className="text-slate-500 text-[10px] ml-1">({cmd.ownerName})</span>}</span></div>
                              <div className="text-right"><div className="text-sm font-bold text-indigo-300">{cmd.winRate}% WR</div><div className="text-[10px] text-slate-500">{cmd.won}W - {cmd.played}G</div></div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-4 animate-in slide-in-from-left duration-200">
                {matchHistory.length === 0 ? <p className="text-center text-slate-500 italic py-8">Nessuna partita salvata</p> : matchHistory.map((match) => (
                    <div key={match.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-700/50 pb-1 mb-1"><span>{new Date(match.date).toLocaleDateString()} - {new Date(match.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="flex items-center gap-1"><Clock size={10}/> {formatDuration(match.duration)} • {match.turns} Turni</span></div>
                      <div className="grid grid-cols-2 gap-2">
                        {match.players.map((p, i) => (
                          <button key={i} onClick={() => p.originalId && setStatsPlayerId(p.originalId)} className={`text-xs p-2 rounded border flex flex-col text-left transition-colors hover:bg-white/5 ${p.originalId === match.winnerOriginalId ? 'bg-amber-500/20 border-amber-500/50 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-900 border-transparent text-slate-400'}`}>
                            <span className="font-bold truncate">{p.name}</span><span className="text-[10px] opacity-70 truncate">{p.deckName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Modal>

      </div>
    );
  }

  // --- GAME VIEW ---
  
  return (
    <div className="bg-slate-950 text-slate-100 fixed inset-0 font-sans select-none overflow-hidden h-[100dvh] w-[100dvw]" style={containerStyle}>
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 -z-10" />

      <div className={`grid h-full w-full p-2 gap-2 transition-all ${getGridClass(gameState.players.length)}`}>
        
        {/* Center Control */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center pointer-events-none">
          <div 
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border-2 border-indigo-500/50 rounded-full shadow-[0_0_50px_rgba(79,70,229,0.3)] flex flex-col items-center justify-center w-24 h-24 md:w-32 md:h-32 group hover:scale-105 transition-transform cursor-pointer select-none touch-manipulation active:scale-95"
            onPointerDown={handleTurnButtonDown}
            onPointerUp={handleTurnButtonUp}
            onPointerLeave={handleTurnButtonLeave}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Turno</span>
            <span className="text-4xl font-black text-white">{gameState.turnCount}</span>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400 group-hover:text-white">
               <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Winner Modal Overlay */}
        {winner && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-8 pointer-events-auto animate-in fade-in duration-500">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/50 rounded-3xl p-8 w-full max-w-md text-center shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-2 animate-bounce">
                <Trophy size={48} className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Vittoria!</h2>
                <p className="text-amber-200 text-xl font-bold">{winner.name}</p>
                <p className="text-slate-500 text-sm mt-1">{winner.deckName}</p>
              </div>
              <div className="grid grid-cols-1 w-full gap-3 mt-4">
                <Button onClick={saveMatch} variant="success" className="py-4 text-lg bg-amber-600 hover:bg-amber-500 border border-amber-400/30"><Save size={20} /> Salva in Storico</Button>
                <Button onClick={exitMatch} variant="ghost" className="py-4 text-slate-400 hover:text-white"><LogOut size={20} /> Esci senza salvare</Button>
              </div>
            </div>
          </div>
        )}

        {/* Player Grid */}
        {(() => {
          let displayPlayers = [...gameState.players];
          if (displayPlayers.length === 4) {
            [displayPlayers[2], displayPlayers[3]] = [displayPlayers[3], displayPlayers[2]];
          }
          if (displayPlayers.length === 5) {
             [displayPlayers[3], displayPlayers[4]] = [displayPlayers[4], displayPlayers[3]];
          }

          return displayPlayers.map((player, idx) => {
            const isActive = player.gameId === gameState.activePlayerIndex;
            const isDead = player.isDead;
            const overlay = playerOverlays[player.gameId]; 
            const feedback = tapFeedback[player.gameId];
            const menuOpen = playerMenus[player.gameId];
            const activeMode = player.activeCounter; 
            let counterColor, bgClass, iconColor, currentValue, currentIcon, fieldName;

            if (activeMode === 'poison') {
              bgClass = 'bg-green-950/40 border-green-500/30';
              iconColor = 'text-green-500';
              counterColor = 'text-green-200';
              currentValue = player.poison;
              currentIcon = <Droplet size={24} className="md:w-6 md:h-6" />;
              fieldName = 'poison';
            } else {
              bgClass = 'bg-cyan-950/40 border-cyan-500/30';
              iconColor = 'text-cyan-400';
              counterColor = 'text-cyan-200';
              currentValue = player.commanderTax;
              currentIcon = <Gem size={24} className="md:w-6 md:h-6" />;
              fieldName = 'commanderTax';
            }

            const maxCmdDmg = Math.max(0, ...Object.values(player.commanderDamage));
            const rotationClass = getRotationClass(idx, gameState.players.length);

            // MODIFIED: Only elevate z-index if overlay is open
            const cardZIndex = overlay ? 'z-[60]' : (isDead ? 'z-0' : (isActive ? 'z-10' : 'z-0'));

            return (
              <div 
                key={player.gameId} 
                className={`relative rounded-2xl overflow-hidden border-2 ${getCellSpanClass(idx, gameState.players.length)} ${
                  isDead ? 'border-red-900/50 grayscale opacity-60' : 
                  isActive ? 'border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.3)]' : 
                  'border-slate-800'
                } ${cardZIndex}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${player.color} opacity-40 z-0`} />
                
                {/* ROTATING CONTENT WRAPPER */}
                <div className={`absolute inset-0 flex flex-col ${rotationClass} transition-transform duration-300`}>
                  
                    {/* Interactive Tap Zones */}
                    {!isDead && !overlay && !winner && (
                      <div className="absolute top-14 bottom-16 left-0 right-0 z-10 flex">
                        <div 
                          className={`w-1/2 h-full border-r border-white/5 bg-white/[0.02] cursor-pointer touch-manipulation transition-colors active:bg-white/10 ${feedback === 'left' ? 'bg-white/10' : ''}`}
                          onPointerDown={(e) => handlePointerDown(e, player.gameId, 'left')}
                          onPointerUp={(e) => handlePointerUp(e, player.gameId, 'left')}
                          onPointerLeave={(e) => handlePointerLeave(e, player.gameId)}
                          onContextMenu={(e) => e.preventDefault()}
                        ></div>
                        <div 
                          className={`w-1/2 h-full bg-white/[0.02] cursor-pointer touch-manipulation transition-colors active:bg-white/10 ${feedback === 'right' ? 'bg-white/10' : ''}`}
                          onPointerDown={(e) => handlePointerDown(e, player.gameId, 'right')}
                          onPointerUp={(e) => handlePointerUp(e, player.gameId, 'right')}
                          onPointerLeave={(e) => handlePointerLeave(e, player.gameId)}
                          onContextMenu={(e) => e.preventDefault()}
                        ></div>
                      </div>
                    )}

                    {/* Layer 3: Content */}
                    <div className="relative z-20 h-full flex flex-col pointer-events-none">
                      <div className="relative px-3 py-2 flex items-center justify-center bg-black/20 pointer-events-auto min-h-[3.5rem] shrink-0">
                        <div className="flex flex-col items-center justify-center w-full"> 
                            <h3 className="font-bold text-sm md:text-lg shadow-black drop-shadow-md truncate">{player.name}</h3>
                            <div className="text-[10px] text-white/70 flex items-center gap-1 truncate">
                                <Shield size={10} /> {player.deckName}
                            </div>
                        </div>
                      </div>

                      <div className="flex-1 flex items-center justify-center w-full min-h-0">
                        {isDead ? (
                          <div className="flex flex-col items-center justify-center gap-2 pointer-events-auto">
                            <div className="flex flex-col items-center text-red-400">
                              <Skull size={24} className="mb-1" />
                              <span className="text-lg font-bold">ELIMINATO</span>
                              <span className="text-[10px] text-red-200/70">{player.deathReason}</span>
                            </div>
                            <button onClick={() => resurrectPlayer(player.gameId)} className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-600">
                              <Undo2 size={12} /> Undo
                            </button>
                          </div>
                        ) : (
                          <div className="text-[20vmin] font-black tracking-tighter drop-shadow-2xl select-none tabular-nums pointer-events-none leading-none">
                            {player.life}
                          </div>
                        )}
                      </div>

                      {!isDead && !winner && (
                        <div className="flex items-center justify-center pointer-events-auto pb-2 min-h-[4rem] shrink-0 relative">
                          {!menuOpen && (
                            <button onClick={() => togglePlayerMenu(player.gameId)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition-transform active:scale-90 z-20">
                              <Plus size={28} className="text-white/80" />
                            </button>
                          )}
                          
                          {/* EXPANDABLE MENU */}
                          {menuOpen && (
                            <div className="absolute bottom-2 left-2 right-2 z-30 bg-slate-950/60 backdrop-blur-md rounded-2xl p-2 border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 flex flex-wrap justify-center gap-2">
                              
                              <div className="w-full flex justify-end mb-1">
                                <button onClick={() => togglePlayerMenu(player.gameId)} className="p-1 text-slate-400 hover:text-white bg-white/10 rounded-full">
                                  <X size={16} />
                                </button>
                              </div>

                              <div className="flex gap-3 items-center justify-center w-full flex-wrap">
                                <button onClick={() => setOverlay(player.gameId, 'MANA')} className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all shrink-0 ${overlay === 'MANA' || Object.values(player.mana).some(v => v > 0) ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-900/50 border-slate-700/30 text-slate-400'}`}>
                                  <Sparkles size={24} />
                                </button>
                                
                                <div className={`flex items-center gap-1 px-1 rounded-full border transition-colors duration-300 h-12 shrink-0 ${bgClass}`}>
                                  <button onClick={() => togglePlayerCounter(player.gameId)} className={`p-1 rounded-full ${iconColor}`}>
                                    {currentIcon}
                                  </button>
                                  <button onClick={() => updatePlayer(player.gameId, p => ({ ...p, [fieldName]: Math.max(0, p[fieldName] - 1) }))} className="w-8 h-full flex items-center justify-center font-bold text-slate-300 hover:text-white text-xl">-</button>
                                  <span className={`font-bold w-8 text-center text-xl ${counterColor}`}>{currentValue}</span>
                                  <button onClick={() => updatePlayer(player.gameId, p => ({ ...p, [fieldName]: p[fieldName] + 1 }))} className="w-8 h-full flex items-center justify-center font-bold text-slate-300 hover:text-white text-xl">+</button>
                                </div>
                                
                                <button onClick={() => setOverlay(player.gameId, 'CMD')} className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all shrink-0 ${maxCmdDmg > 0 ? maxCmdDmg >= 15 ? 'bg-red-600 border-red-500 text-white' : 'bg-red-900/50 border-red-500/30 text-red-300' : 'bg-slate-900/50 border-slate-700/30 text-slate-400'}`}>
                                  <Swords size={24} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* OVERLAYS - INSIDE ROTATION WRAPPER so they rotate too */}
                    {overlay === 'MANA' && (
                      <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex flex-col p-3 animate-in zoom-in-95 duration-200 pointer-events-auto">
                        <button onClick={() => setOverlay(player.gameId, null)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-black/20 rounded-full z-50"><X size={18} /></button>
                        <h4 className="text-center font-bold text-amber-400 mb-1 text-xs flex items-center justify-center gap-1"><Sparkles size={12} /> Mana</h4>
                        <div className="grid grid-cols-3 gap-2 flex-1 content-center">
                          {MANA_TYPES.map(type => (
                            <div key={type.key} className={`flex flex-col items-center justify-center p-1 rounded border ${type.color}`}>
                              <type.icon size={16} className="mb-1 opacity-80" />
                              <div className="flex items-center gap-1">
                                <button onClick={() => updatePlayer(player.gameId, p => ({ ...p, mana: { ...p.mana, [type.key]: Math.max(0, p.mana[type.key] - 1) } }))} className="w-5 h-5 rounded bg-black/30 font-bold text-xs">-</button>
                                <span className="font-bold w-4 text-center text-xs">{player.mana[type.key]}</span>
                                <button onClick={() => updatePlayer(player.gameId, p => ({ ...p, mana: { ...p.mana, [type.key]: p.mana[type.key] + 1 } }))} className="w-5 h-5 rounded bg-black/30 font-bold text-xs">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {overlay === 'CMD' && (
                      <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex flex-col p-3 animate-in zoom-in-95 duration-200 overflow-y-auto pointer-events-auto">
                        <button onClick={() => setOverlay(player.gameId, null)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white bg-black/20 rounded-full z-50"><X size={18} /></button>
                        <h4 className="text-center font-bold text-red-400 mb-2 text-xs flex items-center justify-center gap-1"><Swords size={12} /> Danni Cmd</h4>
                        <div className="flex flex-col gap-1 flex-1">
                          {gameState.players.filter(p => p.gameId !== player.gameId).map(opponent => {
                              const currentDmg = player.commanderDamage[opponent.gameId] || 0;
                              return (
                                <div key={opponent.gameId} className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-white/10">
                                  <div className="flex flex-col min-w-0 flex-1 mr-2">
                                    <span className="text-[10px] font-bold truncate">{opponent.deckName}</span>
                                    <span className="text-[8px] text-slate-400 truncate">{opponent.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => updatePlayer(player.gameId, p => ({ ...p, commanderDamage: { ...p.commanderDamage, [opponent.gameId]: Math.max(0, currentDmg - 1) } }))} className="w-6 h-6 rounded bg-slate-700 font-bold text-xs">-</button>
                                    <span className={`w-5 text-center font-bold text-xs ${currentDmg >= 21 ? 'text-red-500' : 'text-white'}`}>{currentDmg}</span>
                                    <button onClick={() => updatePlayer(player.gameId, p => ({ ...p, life: p.life - 1, commanderDamage: { ...p.commanderDamage, [opponent.gameId]: currentDmg + 1 } }))} className="w-6 h-6 rounded bg-slate-700 font-bold text-xs text-red-400">+</button>
                                  </div>
                                </div>
                              );
                          })}
                        </div>
                      </div>
                    )}
                </div>

              </div>
            );
          });
        })()}
      </div>

      {/* Menu Modal */}
      <Modal 
        isOpen={gameMenuOpen} 
        onClose={() => { setGameMenuOpen(false); setExitConfirmOpen(false); }} 
        title={exitConfirmOpen ? "Conferma Uscita" : "Menu"}
      >
        {exitConfirmOpen ? (
           <div className="flex flex-col gap-4 text-center">
             <p className="text-slate-300">La partita corrente verrà persa. Sei sicuro?</p>
             <div className="grid grid-cols-2 gap-3">
               <Button variant="secondary" onClick={() => setExitConfirmOpen(false)}>Annulla</Button>
               <Button variant="danger" onClick={() => { setView('SETUP'); setGameMenuOpen(false); setExitConfirmOpen(false); setWinner(null); }}>Conferma Uscita</Button>
             </div>
           </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Button variant="secondary" onClick={() => { setGameLogOpen(true); setGameMenuOpen(false); }} className="w-full justify-center py-4 text-lg">
              <History size={20} /> Log Partita Corrente
            </Button>
            <Button variant="danger" onClick={() => setExitConfirmOpen(true)} className="w-full justify-center py-4 text-lg">
              <Home size={20} /> Torna alla Home
            </Button>
          </div>
        )}
      </Modal>

      {/* In-Game Log Modal (UNCHANGED) */}
      <Modal isOpen={gameLogOpen} onClose={() => setGameLogOpen(false)} title="Log Partita Corrente">
        <div className="space-y-4">
          {gameState.history.length === 0 ? (
            <p className="text-center text-slate-500 italic py-8">Nessun evento registrato</p>
          ) : (
            [...gameState.history].reverse().map((log, idx) => {
              const player = gameState.players.find(p => p.gameId === log.playerId);
              if (!player) return null;
              return (
                <div key={idx} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold">
                      T{log.turn}
                    </div>
                    <span className="font-bold text-slate-200">{player.name}</span>
                  </div>
                  <div className={`font-mono font-bold text-lg ${log.diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {log.diff > 0 ? `+${log.diff}` : log.diff}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>

    </div>
  );
}