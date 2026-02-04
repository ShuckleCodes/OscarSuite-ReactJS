import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { useAwards } from '../hooks/useAwards';
import { useGuestsWithScores } from '../hooks/useGuests';
import { useRooms } from '../hooks/useRooms';
import { useAppState } from '../hooks/useAppState';
import { useSocket } from '../context/SocketContext';
import type { Award, GuestWithScore, ScreenMode } from '../types';
import LogoScreen from '../components/display/LogoScreen';
import AwardScreen from '../components/display/AwardScreen';
import ScoreboardScreen from '../components/display/ScoreboardScreen';

export default function DisplayPage() {
  const { data: awards = [] } = useAwards();
  const { data: guests = [], refetch: refetchGuests } = useGuestsWithScores();
  const { data: rooms = [] } = useRooms();
  const { data: appState } = useAppState();
  const { on, off } = useSocket();

  const [screenMode, setScreenMode] = useState<ScreenMode>('logo');
  const [currentAwardId, setCurrentAwardId] = useState<number | null>(null);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [winners, setWinners] = useState<Record<string, number>>({});
  const [currentRoom, setCurrentRoom] = useState<string>('');

  const currentAward = awards.find((a: Award) => a.id === currentAwardId);

  // Load initial winners from app state
  useEffect(() => {
    if (appState?.winners) {
      setWinners(appState.winners);
    }
  }, [appState]);

  // Set page title based on current screen mode
  useEffect(() => {
    const modeNames = { logo: 'Logo', award: 'Award', scoreboard: 'Scoreboard' };
    document.title = `${modeNames[screenMode]} - Awards Show Suite`;
  }, [screenMode]);

  // Listen for WebSocket events
  const handleMessage = useCallback((data: unknown) => {
    const message = data as string;
    const parts = message.split('+++');
    const action = parts[0];

    if (action === 'showLogo') {
      setScreenMode('logo');
      setCurrentAwardId(null);
      setWinnerId(null);
    } else if (action === 'showAward' && parts.length > 1) {
      const awardId = parseInt(parts[1]);
      setCurrentAwardId(awardId);
      setWinnerId(null);
      setScreenMode('award');
    } else if (action === 'showScoreboard') {
      setScreenMode('scoreboard');
      refetchGuests();
    } else if (action === 'selectWinner' && parts.length >= 3) {
      const awardId = parseInt(parts[1]);
      const nomineeId = parseInt(parts[2]);
      setWinners(prev => ({ ...prev, [awardId]: nomineeId }));
      if (currentAwardId === awardId) {
        setWinnerId(nomineeId);
      }
      refetchGuests();
    } else if (action === 'clearWinner' && parts.length > 1) {
      const awardId = parseInt(parts[1]);
      setWinners(prev => {
        const updated = { ...prev };
        delete updated[awardId];
        return updated;
      });
      if (currentAwardId === awardId) {
        setWinnerId(null);
      }
      refetchGuests();
    } else if (action === 'roomsUpdated') {
      // Rooms updated - handled by rooms query
    }
  }, [currentAwardId, refetchGuests]);

  useEffect(() => {
    on('message', handleMessage);
    return () => {
      off('message', handleMessage);
    };
  }, [on, off, handleMessage]);

  const handleRoomChange = (roomCode: string) => {
    setCurrentRoom(roomCode);
  };

  // Filter guests by current room
  const filteredGuests = currentRoom
    ? guests.filter((g: GuestWithScore) =>
        g.rooms.some(r => r.toLowerCase() === currentRoom.toLowerCase())
      )
    : guests;

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        bgcolor: '#0a0a0a',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <AnimatePresence mode="wait">
        {screenMode === 'logo' && (
          <LogoScreen key="logo" awards={awards} eventTitle={appState?.event_title} />
        )}

        {screenMode === 'award' && currentAward && (
          <AwardScreen
            key={`award-${currentAwardId}`}
            award={currentAward}
            guests={filteredGuests}
            winnerId={winnerId}
          />
        )}

        {screenMode === 'scoreboard' && (
          <ScoreboardScreen
            key="scoreboard"
            guests={filteredGuests}
            awards={awards}
            winners={winners}
            rooms={rooms}
            currentRoom={currentRoom}
            onRoomChange={handleRoomChange}
          />
        )}
      </AnimatePresence>
    </Box>
  );
}
