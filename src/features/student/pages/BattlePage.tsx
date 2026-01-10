/**
 * BattlePage Component
 *
 * Real-time multiplayer battle mode where two players compete
 * to finish the same level first.
 * Uses the same UI layout as Adventure's GamePage.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Trophy, Star, RotateCcw, XCircle } from 'lucide-react';
import {
  usePeerConnection,
  usePingLatency,
  useBattleRoom,
  BattleMessage,
  BattleStatus,
} from '../../../core/battle';
import { BattleLobby, LatencyIndicator, BattleCountdown } from '../components/battle';
import { MazeAdventure } from '../components/adventures';
import { LevelDefinition } from '../../../core/engine';
import { parseLevel, loadAdventuresFromApi } from '../../../infrastructure/levels/loader';
import { useProfile } from '../../../infrastructure/storage';
import { useLanguage } from '../../../infrastructure/i18n';
import { defaultTheme } from '../../../infrastructure/themes';
import { ConnectionError } from '../../shared/components/ConnectionError';
import { info, error as logError } from '../../../infrastructure/logging';

// Default battle level (a simple maze)
const DEFAULT_BATTLE_LEVEL = {
  id: 'battle-01',
  name: 'Battle Arena',
  description: 'Race to the goal!',
  grid: ['#######', '#>...*#', '#.###.#', '#.*...#', '#.###.#', '#....*G', '#######'],
  availableCommands: ['forward', 'turnLeft', 'turnRight'],
  availableSensors: ['atGoal', 'wallAhead'],
  availableBlocks: ['command', 'repeat'],
  teachingGoal: 'Battle mode test',
  hints: ['Race to collect all stars and reach the goal!'],
};

export default function BattlePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { roomCode: urlRoomCode } = useParams<{ roomCode?: string }>();

  // Player name from profile
  const { profile } = useProfile();
  const playerName = profile?.name || 'Player';
  const [opponentName, setOpponentName] = useState<string | null>(null);

  // Battle room persistence
  const { savedRoom, loading: sessionLoading, saveRoom, clearRoom } = useBattleRoom();

  // Battle state
  const [status, setStatus] = useState<BattleStatus>('lobby');
  const [level, setLevel] = useState<LevelDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myComplete, setMyComplete] = useState(false);
  const [opponentComplete, setOpponentComplete] = useState(false);
  const [winner, setWinner] = useState<'me' | 'opponent' | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  // Level selection state
  const [mazeLevels, setMazeLevels] = useState<LevelDefinition[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LevelDefinition | null>(null);
  const [isLoadingLevels, setIsLoadingLevels] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track when opponent leaves gracefully
  const [opponentLeft, setOpponentLeft] = useState(false);

  // Show exit confirmation modal
  const [showExitModal, setShowExitModal] = useState(false);

  // Game state for MazeAdventure
  const [resetKey, setResetKey] = useState(0);
  const [showFailure, setShowFailure] = useState(false);
  const [collectCount, setCollectCount] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Ref for handlePong (to avoid circular dependency with usePingLatency)
  const handlePongRef = useRef<(() => void) | null>(null);

  // Handle incoming messages
  const handleMessage = useCallback(
    (message: BattleMessage) => {
      switch (message.type) {
        case 'player-info':
          // Opponent sent their name
          setOpponentName(message.name);
          break;

        case 'ready':
          // Host sent level data
          setLevel(message.level);
          setStatus('ready');
          break;

        case 'start':
          // Game starting - show countdown
          setShowCountdown(true);
          break;

        case 'state-update':
          // Opponent's game state changed (not displayed anymore, just tracked for completion)
          break;

        case 'complete':
          // Opponent finished
          setOpponentComplete(true);
          if (!myComplete) {
            // Opponent won
            setWinner('opponent');
            setStatus('finished');
          }
          break;

        case 'reset':
          // Opponent reset their game
          break;

        case 'ping':
          // Respond to ping
          sendMessage({ type: 'pong' });
          break;

        case 'pong':
          // Update latency measurement
          handlePongRef.current?.();
          break;

        case 'leave':
          // Opponent left the battle gracefully
          setOpponentLeft(true);
          break;
      }
    },
    [myComplete]
  );

  // Handle connection events - send player info when connected
  const handleConnected = useCallback(() => {
    info('Peer connected', undefined, 'BattlePage');
    // Note: sendMessage isn't available yet, we'll send player-info in useEffect
  }, []);

  const handleDisconnected = useCallback(() => {
    info('Peer disconnected', undefined, 'BattlePage');
    // If opponent already left gracefully, don't reset state - let the modal handle it
    if (opponentLeft) {
      return;
    }
    setError('Opponent disconnected');
    setStatus('lobby');
    clearRoom();
    navigate('/battle', { replace: true });
  }, [opponentLeft, clearRoom, navigate]);

  const handleError = useCallback(
    (err: string) => {
      setError(err);
      clearRoom();
      // Navigate to /battle to show error on join form
      if (urlRoomCode) {
        navigate('/battle', { replace: true });
      }
    },
    [clearRoom, urlRoomCode, navigate]
  );

  // Peer connection
  const { roomCode, isConnected, isHost, createRoom, joinRoom, sendMessage, disconnect } =
    usePeerConnection({
      onMessage: handleMessage,
      onConnected: handleConnected,
      onDisconnected: handleDisconnected,
      onError: handleError,
    });

  // Ping/latency measurement
  const { latency, handlePong } = usePingLatency({
    sendMessage,
    isConnected,
  });

  // Keep handlePongRef in sync
  useEffect(() => {
    handlePongRef.current = handlePong;
  }, [handlePong]);

  // Load maze levels on mount or when language changes
  useEffect(() => {
    const loadMazeLevels = async () => {
      setIsLoadingLevels(true);
      setLoadError(null);
      try {
        const { adventures } = await loadAdventuresFromApi(language);
        const levels: LevelDefinition[] = [];

        for (const adventure of adventures) {
          // Only include maze-type adventures (or adventures without explicit gameType)
          if (!adventure.gameType || adventure.gameType === 'maze') {
            // Filter to levels that have grid (new format) or entities (old format)
            const mazeLevelsFromAdventure = adventure.levels.filter(
              (l: LevelDefinition) => l.grid && l.grid.length > 0
            );
            levels.push(...mazeLevelsFromAdventure);
          }
        }

        // Add the default battle level as first option
        const defaultParsed = parseLevel(DEFAULT_BATTLE_LEVEL);
        setMazeLevels([defaultParsed, ...levels]);
        setSelectedLevel(defaultParsed);
      } catch (err) {
        logError('Failed to load levels', err, undefined, 'BattlePage');
        setLoadError(err instanceof Error ? err.message : 'Failed to load levels');
      } finally {
        setIsLoadingLevels(false);
      }
    };

    loadMazeLevels();
  }, [language]);

  // Send player info when connected
  useEffect(() => {
    if (isConnected && playerName) {
      sendMessage({ type: 'player-info', name: playerName });
    }
  }, [isConnected, playerName, sendMessage]);

  // When both connected, host sends level data
  useEffect(() => {
    // Host: when connected and haven't sent level yet (status is still lobby or waiting)
    if (isConnected && isHost && (status === 'lobby' || status === 'waiting') && selectedLevel) {
      // Use selected level
      setLevel(selectedLevel);
      setStatus('ready');

      // Send level to opponent
      sendMessage({ type: 'ready', level: selectedLevel });
    }
  }, [isConnected, isHost, status, sendMessage, selectedLevel]);

  // When guest connects, wait for host to send level
  useEffect(() => {
    // Guest: when connected but haven't received level yet
    if (isConnected && !isHost && status === 'lobby') {
      setStatus('waiting');
    }
  }, [isConnected, isHost, status]);

  // Handle create room
  const handleCreateRoom = useCallback(() => {
    setError(null);
    createRoom();
  }, [createRoom]);

  // Handle join room
  const handleJoinRoom = useCallback(
    (code: string) => {
      setError(null);
      joinRoom(code);
    },
    [joinRoom]
  );

  // Navigate to room URL when room code is generated (after create/join)
  useEffect(() => {
    if (roomCode && !urlRoomCode) {
      // Room created/joined, save to API and navigate to room URL
      saveRoom(roomCode, isHost, playerName);
      navigate(`/battle/${roomCode}`, { replace: true });
    }
  }, [roomCode, urlRoomCode, isHost, playerName, saveRoom, navigate]);

  // Auto-connect when visiting /battle/:roomCode with saved room
  useEffect(() => {
    // Wait for session to load from API before attempting reconnection
    if (sessionLoading) return;

    if (urlRoomCode && savedRoom && !roomCode && status === 'lobby' && !error) {
      // We have a URL room code and saved room state (only if no error - avoid retry loop)
      if (savedRoom.roomCode.toUpperCase() === urlRoomCode.toUpperCase()) {
        // Saved room matches URL, try to reconnect
        setError(null);
        if (savedRoom.isHost) {
          // Recreate the room as host
          createRoom(urlRoomCode.toUpperCase());
        } else {
          // Rejoin as guest
          joinRoom(urlRoomCode.toUpperCase());
        }
      } else {
        // URL doesn't match saved room, clear and redirect
        clearRoom();
        navigate('/battle', { replace: true });
      }
    } else if (urlRoomCode && !savedRoom && status === 'lobby' && !error) {
      // URL has room code but no saved room - try to join as guest (only if no error)
      setError(null);
      saveRoom(urlRoomCode.toUpperCase(), false, playerName);
      joinRoom(urlRoomCode.toUpperCase());
    }
  }, [
    urlRoomCode,
    savedRoom,
    sessionLoading,
    roomCode,
    status,
    error,
    createRoom,
    joinRoom,
    saveRoom,
    clearRoom,
    navigate,
    playerName,
  ]);

  // Handle start game (host only)
  const handleStartGame = useCallback(() => {
    // Show countdown for both players
    setShowCountdown(true);
    sendMessage({ type: 'start' });
  }, [sendMessage]);

  // Handle countdown complete
  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setStatus('playing');
  }, []);

  // Handle play again
  const handlePlayAgain = useCallback(async () => {
    // Notify opponent before leaving - wait for message to be sent
    if (isConnected) {
      sendMessage({ type: 'leave' });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    // Reset state
    setMyComplete(false);
    setOpponentComplete(false);
    setWinner(null);
    setOpponentName(null);
    setOpponentLeft(false);
    setStatus('lobby');
    setResetKey((k) => k + 1);
    setShowFailure(false);
    setCollectCount(0);
    clearRoom();
    disconnect();
    navigate('/battle', { replace: true });
  }, [isConnected, sendMessage, disconnect, clearRoom, navigate]);

  // Handle exit button click - show modal and notify opponent
  const handleExitClick = useCallback(() => {
    // Notify opponent before showing modal
    if (isConnected) {
      sendMessage({ type: 'leave' });
    }
    setShowExitModal(true);
  }, [isConnected, sendMessage]);

  // Handle go home from exit modal
  const handleGoHome = useCallback(() => {
    clearRoom();
    disconnect();
    navigate('/');
  }, [disconnect, clearRoom, navigate]);

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle level completion for MazeAdventure
  const handleLevelComplete = useCallback(
    (stars: number) => {
      setCollectCount(stars);
      setMyComplete(true);
      sendMessage({ type: 'complete' });

      if (!opponentComplete) {
        // I won
        setWinner('me');
        setStatus('finished');
      }
    },
    [opponentComplete, sendMessage]
  );

  // Handle level failure
  const handleFail = useCallback(() => {
    setShowFailure(true);
  }, []);

  // Reset level
  const resetLevel = useCallback(() => {
    setShowFailure(false);
    setResetKey((k) => k + 1);
  }, []);

  // Loading state
  if (isLoadingLevels) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#4a7a2a]" />
          <div className="text-gray-600 text-xl">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  // Error state - server down
  if (loadError) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center p-4">
        <ConnectionError message={loadError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Render lobby
  if (status === 'lobby' || status === 'waiting' || status === 'connecting') {
    return (
      <BattleLobby
        roomCode={roomCode}
        isConnected={isConnected}
        isHost={isHost}
        error={error}
        playerName={playerName}
        levels={mazeLevels}
        selectedLevel={selectedLevel}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onSelectLevel={setSelectedLevel}
      />
    );
  }

  // Render ready screen (waiting for host to start)
  if (status === 'ready') {
    return (
      <div className="flex flex-col items-center min-h-full bg-white p-4 pt-16">
        {/* Countdown overlay */}
        {showCountdown && <BattleCountdown onComplete={handleCountdownComplete} />}

        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            <span className="inline-block animate-bounce">
              {isHost ? t('battle.startTheBattle') : t('battle.waitingForHost')}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isHost ? t('battle.bothPlayersConnected') : t('battle.connected')}
          </h2>

          <p className="text-gray-600 mb-6">{level?.name || 'Battle Arena'}</p>

          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={showCountdown}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl transition-colors text-xl"
            >
              {t('battle.startBattle')}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('battle.waitingForHostToStart')}
            </div>
          )}
        </div>

        {/* Opponent Left Modal */}
        {opponentLeft && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
              <div className="text-8xl mb-4">👋</div>

              <h2 className="text-2xl font-bold text-gray-700 mb-2">{t('battle.opponentLeft')}</h2>
              <p className="text-gray-600 mb-6">
                {opponentName || 'Opponent'} {t('battle.hasLeftTheBattle')}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105"
                >
                  {t('battle.playAgain')}
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full py-3 bg-[#e8f5e0] hover:bg-[#d4ecc8] text-[#4a7a2a] font-medium rounded-2xl transition-all"
                >
                  {t('battle.goHome')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render game
  if (status === 'playing' || status === 'finished') {
    return (
      <div className="h-screen bg-gray-100 overflow-hidden flex flex-col">
        {/* Top Bar - Battle Info (matching Classroom style) */}
        <div className="flex-shrink-0 bg-white border-b shadow-sm px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Left: Exit & Level Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleExitClick}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('battle.exit')}
              </button>
              <div>
                <h1 className="text-lg font-bold text-[#4a7a2a]">
                  ⚔️ {t('battle.title')}: {roomCode}
                </h1>
                <p className="text-sm text-gray-600">{level?.name || 'Battle Arena'}</p>
              </div>
            </div>

            {/* Center: VS indicator */}
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium text-blue-700">{playerName}</span>
              </div>
              <span className="text-gray-600 font-bold">VS</span>
              <div className="text-sm">
                <span className="font-medium text-orange-600">{opponentName || 'Opponent'}</span>
              </div>
            </div>

            {/* Right: Latency & End Battle */}
            <div className="flex items-center gap-3">
              <LatencyIndicator latency={latency} />
              <button
                onClick={handleExitClick}
                className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {t('battle.endBattle')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 h-full overflow-hidden relative">
          {level && (
            <MazeAdventure
              level={level}
              theme={defaultTheme}
              resetKey={resetKey}
              isLargeScreen={isLargeScreen}
              onComplete={handleLevelComplete}
              onFail={handleFail}
              onCodeChange={() => {}}
            />
          )}
        </div>

        {/* Victory Modal */}
        {myComplete && status === 'finished' && winner === 'me' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
              <div className="relative mb-4">
                <div className="absolute -top-2 -left-2 text-4xl animate-ping">✨</div>
                <div
                  className="absolute -top-2 -right-2 text-4xl animate-ping"
                  style={{ animationDelay: '0.2s' }}
                >
                  ✨
                </div>
                <Trophy className="w-24 h-24 mx-auto text-yellow-500 animate-bounce" />
              </div>

              <h2 className="text-3xl font-bold text-[#4a7a2a] mb-2">{t('battle.youWin')}</h2>
              <p className="text-gray-600 mb-2">You defeated {opponentName}!</p>

              {collectCount > 0 && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  <span className="text-xl font-bold text-[#4a7a2a]">
                    {collectCount} {t('adventure.stars')}
                  </span>
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105"
                >
                  {t('battle.playAgain')}
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full py-3 bg-[#e8f5e0] hover:bg-[#d4ecc8] text-[#4a7a2a] font-medium rounded-2xl transition-all"
                >
                  {t('battle.goHome')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Defeat Modal */}
        {status === 'finished' && winner === 'opponent' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
              <div className="text-8xl mb-4">😢</div>

              <h2 className="text-2xl font-bold text-gray-700 mb-2">{t('battle.youLose')}</h2>
              <p className="text-gray-600 mb-6">{opponentName} finished first!</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-6 h-6" />
                  {t('battle.playAgain')}
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full py-3 bg-[#e8f5e0] hover:bg-[#d4ecc8] text-[#4a7a2a] font-medium rounded-2xl transition-all"
                >
                  {t('battle.goHome')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Failure Modal */}
        {showFailure && !myComplete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
              <div className="text-8xl mb-4">😢</div>

              <h2 className="text-2xl font-bold text-gray-700 mb-2">{t('adventure.notDoneYet')}</h2>
              <p className="text-gray-600 mb-6">{t('adventure.thinkAgain')}</p>

              <button
                onClick={resetLevel}
                className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-6 h-6" />
                {t('adventure.tryAgain')}
              </button>
            </div>
          </div>
        )}

        {/* Opponent Left Modal */}
        {opponentLeft && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
              <div className="text-8xl mb-4">👋</div>

              <h2 className="text-2xl font-bold text-gray-700 mb-2">{t('battle.opponentLeft')}</h2>
              <p className="text-gray-600 mb-6">
                {opponentName || 'Opponent'} {t('battle.hasLeftTheBattle')}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105"
                >
                  {t('battle.playAgain')}
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full py-3 bg-[#e8f5e0] hover:bg-[#d4ecc8] text-[#4a7a2a] font-medium rounded-2xl transition-all"
                >
                  {t('battle.goHome')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exit Modal */}
        {showExitModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center animate-[bounceIn_0.5s_ease-out]">
              <div className="text-8xl mb-4">⚔️</div>

              <h2 className="text-2xl font-bold text-[#4a7a2a] mb-2">{t('battle.wellDone')}</h2>
              <p className="text-gray-600 mb-6">{t('battle.battleEnded')}</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePlayAgain}
                  className="w-full py-4 bg-gradient-to-r from-[#5a8a3a] to-[#7dad4c] text-white text-xl font-bold rounded-2xl hover:opacity-90 shadow-lg transition-all hover:scale-105"
                >
                  {t('battle.playAgain')}
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full py-3 bg-[#e8f5e0] hover:bg-[#d4ecc8] text-[#4a7a2a] font-medium rounded-2xl transition-all"
                >
                  {t('battle.goHome')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
