import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { Award, GuestWithScore, Room } from '../../types';

interface ScoreboardScreenProps {
  guests: GuestWithScore[];
  awards: Award[];
  winners: Record<string, number>;
  rooms: Room[];
  currentRoom: string;
  onRoomChange: (roomCode: string) => void;
}

interface AnimatedGuest extends GuestWithScore {
  displayScore: number;
  oldScore: number;
}

const STORAGE_KEY = 'awards-scoreboard-scores';

export default function ScoreboardScreen({
  guests,
  awards,
  winners,
  rooms,
  currentRoom,
  onRoomChange
}: ScoreboardScreenProps) {
  const [animatedGuests, setAnimatedGuests] = useState<AnimatedGuest[]>([]);
  const [showTable, setShowTable] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Load previous scores from localStorage
  const getPreviousScores = (): Record<number, number> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Save current scores to localStorage
  const saveCurrentScores = (guestScores: Record<number, number>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestScores));
    } catch {
      // Ignore storage errors
    }
  };

  // Initialize animated guests with previous scores
  useEffect(() => {
    const previousScores = getPreviousScores();

    const initialGuests = guests.map(g => ({
      ...g,
      displayScore: previousScores[g.id] ?? 0,
      oldScore: previousScores[g.id] ?? 0
    }));
    setAnimatedGuests(initialGuests);
    setShowTable(false);

    // Start animation after 500ms delay
    const animationTimeout = setTimeout(() => {
      animateScores(previousScores);
    }, 500);

    // Show table after animation completes (5 seconds)
    const tableTimeout = setTimeout(() => {
      setShowTable(true);
      // Save the new scores after animation completes
      const newScores: Record<number, number> = {};
      guests.forEach(g => {
        newScores[g.id] = g.score || 0;
      });
      saveCurrentScores(newScores);
    }, 5000);

    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(tableTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [guests]);

  // Easing function
  const ease = (t: number, a: number, b: number) => {
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    return (b - a) * eased + a;
  };

  // Animate scores from previous to current
  const animateScores = (previousScores: Record<number, number>) => {
    const duration = 2000;
    const start = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      setAnimatedGuests(prev =>
        prev.map(guest => {
          const oldScore = previousScores[guest.id] ?? 0;
          const targetScore = guests.find(g => g.id === guest.id)?.score || 0;
          const currentScore = Math.round(ease(progress, oldScore, targetScore));
          return {
            ...guest,
            displayScore: currentScore
          };
        })
      );

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  // Sort guests by display score
  const sortedGuests = [...animatedGuests].sort((a, b) => {
    const scoreDiff = (b.displayScore || 0) - (a.displayScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  });

  const maxScore = sortedGuests.length > 0 ? Math.max(...sortedGuests.map(g => g.score || 0)) : 0;

  const getPhotoUrl = (photo: string) => {
    if (!photo) return '/data/backgrounds/trophy.png';
    return `/data/${photo}`;
  };

  const getNomineeName = (awardId: number, nomineeId: number) => {
    if (!nomineeId) return '-';
    const award = awards.find(a => a.id === awardId);
    if (!award) return '-';
    const nominee = award.nominees.find(n => n.id === nomineeId);
    return nominee ? nominee.name.split(' (')[0].substring(0, 10) : '-';
  };

  const shortenAwardName = (name: string) => {
    const shortNames: Record<string, string> = {
      'Best Picture': 'Picture',
      'Best Director': 'Director',
      'Best Actor': 'Actor',
      'Best Actress': 'Actress',
      'Best Supporting Actor': 'Supp. Actor',
      'Best Supporting Actress': 'Supp. Actress',
      'Best Original Screenplay': 'Orig. SP',
      'Best Adapted Screenplay': 'Adap. SP',
      'Best Animated Feature': 'Animated',
      'Best International Feature': 'Int. Feat.',
      'Best Documentary Feature': 'Doc. Feat.',
      'Best Documentary Short': 'Doc. Short',
      'Best Live-Action Short': 'Live Short',
      'Best Animated Short': 'Anim. Short',
      'Best Original Score': 'Score',
      'Best Original Song': 'Song',
      'Best Sound': 'Sound',
      'Best Production Design': 'Prod. Design',
      'Best Cinematography': 'Cinematog.',
      'Best Makeup and Hairstyling': 'Makeup',
      'Best Costume Design': 'Costume',
      'Best Film Editing': 'Editing',
      'Best Visual Effects': 'VFX',
      'Best Casting': 'Casting'
    };
    return shortNames[name] || name.replace('Best ', '');
  };

  const getPredictionStatus = (prediction: number | undefined, awardId: number) => {
    if (!prediction) return 'none';
    const winner = winners[awardId];
    if (!winner) return 'pending';
    return prediction === winner ? 'correct' : 'incorrect';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        overflow: 'hidden',
        backgroundImage: 'url(/data/backgrounds/bg-scoreboard.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Typography
            variant="h2"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              textShadow: '0 0 20px rgba(201, 162, 39, 0.5)'
            }}
          >
            Scoreboard
          </Typography>
        </motion.div>

        {/* Room Selector */}
        {rooms.length > 0 && (
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={currentRoom}
                onChange={(e) => onRoomChange(e.target.value as string)}
                displayEmpty
                sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <MenuItem value="">All Guests</MenuItem>
                {rooms.map(room => (
                  <MenuItem key={room.id} value={room.code}>{room.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </motion.div>
        )}
      </Box>

      {/* Guest Cards */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1vw',
          flex: 1,
          position: 'relative',
          overflow: 'visible',
          width: '100%'
        }}
      >
        <AnimatePresence>
          {sortedGuests.map((guest) => {
            const isLeader = (guest.displayScore || 0) === maxScore && maxScore > 0;
            // Calculate responsive card width based on number of guests (max 10 per row)
            const guestCount = sortedGuests.length;
            const cardsPerRow = Math.min(guestCount, 10);
            const cardWidth = `${Math.min(15, 90 / Math.max(cardsPerRow, 3))}vw`;
            const photoSize = `${Math.min(8, 45 / Math.max(cardsPerRow, 3))}vw`;

            return (
              <motion.div
                key={guest.id}
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  layout: { duration: 0.8, ease: 'easeInOut' },
                  opacity: { duration: 0.3 },
                  y: { duration: 0.3 }
                }}
              >
                <Box
                  sx={{
                    width: cardWidth,
                    textAlign: 'center',
                    p: '1vw',
                    bgcolor: 'rgba(30, 30, 30, 0.9)',
                    borderRadius: '0.5vw',
                    border: '0.15vw solid',
                    borderColor: isLeader ? 'primary.main' : 'grey.800',
                    ...(isLeader && {
                      boxShadow: '0 0 20px rgba(201, 162, 39, 0.5)'
                    })
                  }}
                >
                  <Box
                    component="img"
                    src={getPhotoUrl(guest.photo)}
                    alt={guest.name}
                    sx={{
                      width: photoSize,
                      height: photoSize,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '0.2vw solid',
                      borderColor: isLeader ? 'primary.main' : 'grey.600',
                      mb: 1
                    }}
                  />

                  <Typography
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      mb: 0.5,
                      fontSize: 'clamp(0.8rem, 1.2vw, 1.5rem)'
                    }}
                  >
                    {guest.name}
                  </Typography>

                  <Typography
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700,
                      textShadow: '0 0 10px rgba(201, 162, 39, 0.5)',
                      fontSize: 'clamp(1.5rem, 2.5vw, 3rem)'
                    }}
                  >
                    {guest.displayScore}
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>

      {/* Scores Table */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: showTable ? 0 : '100%' }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '45%',
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          borderTop: '2px solid #C9A227',
          overflow: 'auto'
        }}
      >
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#1a1a1a', color: 'primary.main', fontWeight: 700 }}>
                  Guest
                </TableCell>
                {awards.map(award => (
                  <TableCell
                    key={award.id}
                    sx={{ bgcolor: '#1a1a1a', color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    {shortenAwardName(award.name)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...guests].sort((a, b) => a.name.localeCompare(b.name)).map(guest => (
                <TableRow key={guest.id} hover>
                  <TableCell sx={{ color: 'white', fontWeight: 500 }}>
                    {guest.name}
                  </TableCell>
                  {awards.map(award => {
                    const prediction = guest.predictions[award.id];
                    const status = getPredictionStatus(prediction, award.id);
                    const nomineeName = getNomineeName(award.id, prediction);

                    let bgColor = 'transparent';
                    let textColor = 'grey.500';
                    if (status === 'correct') {
                      bgColor = 'rgba(76, 175, 80, 0.3)';
                      textColor = 'success.main';
                    } else if (status === 'incorrect') {
                      bgColor = 'rgba(244, 67, 54, 0.3)';
                      textColor = 'error.main';
                    } else if (status === 'pending') {
                      bgColor = 'rgba(33, 150, 243, 0.2)';
                      textColor = 'primary.main';
                    }

                    return (
                      <TableCell
                        key={award.id}
                        sx={{
                          bgcolor: bgColor,
                          color: textColor,
                          fontSize: '0.7rem',
                          padding: '4px 8px'
                        }}
                      >
                        {nomineeName}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>
    </motion.div>
  );
}
