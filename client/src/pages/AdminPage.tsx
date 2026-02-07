import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Tv as TvIcon,
  Leaderboard as LeaderboardIcon,
  Image as ImageIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useAwards } from '../hooks/useAwards';
import { useGuestsWithScores, useDeleteGuest, useClearAllGuests, useCreateGuest, useUpdateGuest } from '../hooks/useGuests';
import { useRooms, useCreateRoom, useDeleteRoom } from '../hooks/useRooms';
import { useAppState, useSetPredictionsLocked, useSetWinner, useClearWinner } from '../hooks/useAppState';
import { useSocket } from '../context/SocketContext';
import type { Award, GuestWithScore } from '../types';

export default function AdminPage() {
  const { data: awards = [] } = useAwards();
  const { data: guests = [], refetch: refetchGuests } = useGuestsWithScores();
  const { data: rooms = [], refetch: refetchRooms } = useRooms();
  const { data: appState, refetch: refetchAppState } = useAppState();
  const { sendMessage, on, off, connected } = useSocket();

  const deleteGuest = useDeleteGuest();
  const clearAllGuests = useClearAllGuests();
  const createGuestMutation = useCreateGuest();
  const updateGuestMutation = useUpdateGuest();
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();
  const setPredictionsLocked = useSetPredictionsLocked();
  const setWinnerMutation = useSetWinner();
  const clearWinnerMutation = useClearWinner();

  const [selectedAwardId, setSelectedAwardId] = useState<number | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');
  const [deleteAllDialog, setDeleteAllDialog] = useState(false);

  // New guest dialog state
  const [newGuestDialog, setNewGuestDialog] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestRooms, setNewGuestRooms] = useState<string[]>([]);

  // Edit guest rooms dialog state
  const [editGuestDialog, setEditGuestDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestWithScore | null>(null);
  const [editGuestRooms, setEditGuestRooms] = useState<string[]>([]);

  const winners = appState?.winners || {};
  const predictionsLocked = appState?.predictions_locked ?? false;
  const selectedAward = awards.find((a: Award) => a.id === selectedAwardId);

  // Set page title
  useEffect(() => {
    document.title = 'Admin - Awards Show Suite';
  }, []);

  // Sort guests by score
  const sortedGuests = [...guests].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Listen for WebSocket events
  const handleMessage = useCallback((data: unknown) => {
    const message = data as string;
    const parts = message.split('+++');
    const action = parts[0];

    if (action === 'guestSubmitted' || action === 'guestsUpdated') {
      refetchGuests();
    } else if (action === 'roomsUpdated') {
      refetchRooms();
    }
  }, [refetchGuests, refetchRooms]);

  useEffect(() => {
    on('message', handleMessage);
    return () => {
      off('message', handleMessage);
    };
  }, [on, off, handleMessage]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGuests();
      refetchAppState();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchGuests, refetchAppState]);

  const handleShowLogo = () => {
    sendMessage('showLogo');
  };

  const handleShowScoreboard = () => {
    sendMessage('showScoreboard');
  };

  const handleShowAward = () => {
    if (selectedAwardId) {
      sendMessage(`showAward+++${selectedAwardId}`);
    }
  };

  const handleToggleLock = async () => {
    const newLocked = !predictionsLocked;
    await setPredictionsLocked.mutateAsync(newLocked);
    sendMessage(newLocked ? 'lockPredictions' : 'unlockPredictions');
  };

  const handleSelectWinner = async (nomineeId: number) => {
    if (!selectedAwardId) return;
    await setWinnerMutation.mutateAsync({ awardId: selectedAwardId, nomineeId });
    sendMessage(`selectWinner+++${selectedAwardId}+++${nomineeId}`);
    refetchGuests();
  };

  const handleClearWinner = async (awardId: number) => {
    await clearWinnerMutation.mutateAsync(awardId);
    sendMessage(`clearWinner+++${awardId}`);
    refetchGuests();
  };

  const handleCreateRoom = async () => {
    if (!newRoomName || !newRoomCode) return;
    await createRoom.mutateAsync({
      name: newRoomName,
      code: newRoomCode.toLowerCase().replace(/\s+/g, '')
    });
    setNewRoomName('');
    setNewRoomCode('');
    sendMessage('roomsUpdated');
  };

  const handleDeleteRoom = async (roomId: number) => {
    await deleteRoom.mutateAsync(roomId);
    sendMessage('roomsUpdated');
  };

  const handleDeleteGuest = async (guestId: number) => {
    if (window.confirm('Are you sure you want to delete this guest?')) {
      await deleteGuest.mutateAsync(guestId);
      sendMessage('guestsUpdated');
    }
  };

  const handleClearAllGuests = async () => {
    await clearAllGuests.mutateAsync();
    setDeleteAllDialog(false);
    sendMessage('guestsUpdated');
  };

  const handleCreateGuest = async () => {
    if (!newGuestName.trim()) return;
    await createGuestMutation.mutateAsync({
      name: newGuestName.trim(),
      rooms: newGuestRooms
    });
    setNewGuestDialog(false);
    setNewGuestName('');
    setNewGuestRooms([]);
    sendMessage('guestsUpdated');
  };

  const handleEditGuestRooms = (guest: GuestWithScore) => {
    setEditingGuest(guest);
    setEditGuestRooms(guest.rooms || []);
    setEditGuestDialog(true);
  };

  const handleSaveGuestRooms = async () => {
    if (!editingGuest) return;
    await updateGuestMutation.mutateAsync({
      guestId: editingGuest.id,
      updates: { rooms: editGuestRooms }
    });
    setEditGuestDialog(false);
    setEditingGuest(null);
    setEditGuestRooms([]);
    sendMessage('guestsUpdated');
  };

  const getNomineeName = (awardId: number, nomineeId: number) => {
    const award = awards.find((a: Award) => a.id === awardId);
    if (!award) return '-';
    const nominee = award.nominees.find(n => n.id === nomineeId);
    return nominee ? nominee.name.split(' (')[0].substring(0, 15) : '-';
  };

  const getPredictionColor = (guest: GuestWithScore, awardId: number): 'success' | 'error' | 'primary' | 'default' => {
    const prediction = guest.predictions[awardId];
    if (!prediction) return 'default';

    const winner = winners[awardId];
    if (!winner) return 'primary';

    return prediction === winner ? 'success' : 'error';
  };

  const getRoomName = (code: string) => {
    const room = rooms.find(r => r.code === code);
    return room?.name || code;
  };

  const shortenAwardName = (name: string) => {
    const shortNames: Record<string, string> = {
      'Best Picture': 'Pic',
      'Best Director': 'Dir',
      'Best Actor': 'Actor',
      'Best Actress': 'Actress',
      'Best Supporting Actor': 'S.Actor',
      'Best Supporting Actress': 'S.Actress',
      'Best Original Screenplay': 'O.SP',
      'Best Adapted Screenplay': 'A.SP',
      'Best Animated Feature': 'Anim',
      'Best International Feature': 'Intl',
      'Best Documentary Feature': 'Doc',
      'Best Documentary Short': 'Doc.S',
      'Best Live-Action Short': 'Live.S',
      'Best Animated Short': 'Anim.S',
      'Best Original Score': 'Score',
      'Best Original Song': 'Song',
      'Best Sound': 'Sound',
      'Best Production Design': 'Prod',
      'Best Cinematography': 'Cine',
      'Best Makeup and Hairstyling': 'Makeup',
      'Best Costume Design': 'Cost',
      'Best Film Editing': 'Edit',
      'Best Visual Effects': 'VFX',
      'Best Casting': 'Cast'
    };
    return shortNames[name] || name.replace('Best ', '');
  };

  return (
    <Container maxWidth={false} sx={{ py: 4, width: '95%', mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Admin Control Panel
        </Typography>
        <Chip
          label={connected ? 'Connected' : 'Disconnected'}
          color={connected ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Display Controls */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Display Controls</Typography>

              <ButtonGroup orientation="vertical" fullWidth sx={{ mb: 2 }}>
                <Button
                  startIcon={<ImageIcon />}
                  onClick={handleShowLogo}
                  variant="outlined"
                >
                  Show Logo
                </Button>
                <Button
                  startIcon={<LeaderboardIcon />}
                  onClick={handleShowScoreboard}
                  variant="outlined"
                >
                  Show Scoreboard
                </Button>
              </ButtonGroup>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Award</InputLabel>
                <Select
                  value={selectedAwardId ?? ''}
                  label="Select Award"
                  onChange={(e) => setSelectedAwardId(e.target.value as number)}
                >
                  {awards.map((award: Award) => (
                    <MenuItem key={award.id} value={award.id}>
                      {award.name}
                      {winners[award.id] && ' ✓'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                fullWidth
                startIcon={<TvIcon />}
                onClick={handleShowAward}
                disabled={!selectedAwardId}
              >
                Show on Screen
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Winner Selection */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Winner Selection
                {selectedAward && `: ${selectedAward.name}`}
              </Typography>

              {selectedAward ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedAward.nominees.map((nominee) => {
                    const isWinner = winners[selectedAward.id] === nominee.id;
                    return (
                      <Button
                        key={nominee.id}
                        variant={isWinner ? 'contained' : 'outlined'}
                        color={isWinner ? 'primary' : 'inherit'}
                        onClick={() => handleSelectWinner(nominee.id)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                      >
                        {isWinner && '🏆 '}
                        {nominee.name}
                        {nominee.subHeading && ` (${nominee.subHeading})`}
                      </Button>
                    );
                  })}
                  {winners[selectedAward.id] && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => handleClearWinner(selectedAward.id)}
                      sx={{ mt: 1 }}
                    >
                      Clear Winner
                    </Button>
                  )}
                </Box>
              ) : (
                <Alert severity="info">Select an award to choose a winner</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Settings & Rooms */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Settings</Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={predictionsLocked}
                    onChange={handleToggleLock}
                    color="primary"
                  />
                }
                label={predictionsLocked ? 'Predictions Locked' : 'Predictions Open'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Rooms</Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Room Name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  size="small"
                  placeholder="Code"
                  value={newRoomCode}
                  onChange={(e) => setNewRoomCode(e.target.value)}
                  sx={{ width: 100 }}
                />
                <IconButton
                  color="primary"
                  onClick={handleCreateRoom}
                  disabled={!newRoomName || !newRoomCode}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {rooms.map((room) => (
                <Box
                  key={room.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5
                  }}
                >
                  <Typography>{room.name} ({room.code})</Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteRoom(room.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Guests Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Guests ({guests.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    color="primary"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setNewGuestDialog(true)}
                  >
                    Add Guest
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setDeleteAllDialog(true)}
                    disabled={guests.length === 0}
                  >
                    Clear All Guests
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Score</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Rooms</TableCell>
                      {awards.map((award: Award) => (
                        <TableCell key={award.id} sx={{ fontWeight: 700, minWidth: 60, fontSize: '0.75rem' }}>
                          {shortenAwardName(award.name)}
                        </TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedGuests.map((guest: GuestWithScore) => (
                      <TableRow key={guest.id} hover>
                        <TableCell>{guest.name}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={guest.score || 0}
                            color={guest.score > 0 ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{guest.rooms.map(getRoomName).join(', ') || '-'}</span>
                            <IconButton
                              size="small"
                              onClick={() => handleEditGuestRooms(guest)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        {awards.map((award: Award) => (
                          <TableCell key={award.id}>
                            <Chip
                              label={guest.predictions[award.id]
                                ? getNomineeName(award.id, guest.predictions[award.id])
                                : '-'}
                              color={getPredictionColor(guest, award.id)}
                              size="small"
                              variant={guest.predictions[award.id] ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteGuest(guest.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete All Dialog */}
      <Dialog open={deleteAllDialog} onClose={() => setDeleteAllDialog(false)}>
        <DialogTitle>Clear All Guests?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all {guests.length} guests and their predictions.
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialog(false)}>Cancel</Button>
          <Button onClick={handleClearAllGuests} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Guest Dialog */}
      <Dialog open={newGuestDialog} onClose={() => setNewGuestDialog(false)}>
        <DialogTitle>Add New Guest</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newGuestName}
            onChange={(e) => setNewGuestName(e.target.value)}
            sx={{ mt: 2 }}
          />
          {rooms.length > 0 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Rooms (optional)</InputLabel>
              <Select
                multiple
                value={newGuestRooms}
                label="Rooms (optional)"
                onChange={(e) => setNewGuestRooms(e.target.value as string[])}
              >
                {rooms.map((room) => (
                  <MenuItem key={room.id} value={room.code}>
                    {room.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGuestDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateGuest} variant="contained" disabled={!newGuestName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Guest Rooms Dialog */}
      <Dialog open={editGuestDialog} onClose={() => setEditGuestDialog(false)}>
        <DialogTitle>Edit Rooms for {editingGuest?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Rooms</InputLabel>
            <Select
              multiple
              value={editGuestRooms}
              label="Rooms"
              onChange={(e) => setEditGuestRooms(e.target.value as string[])}
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.code}>
                  {room.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGuestDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveGuestRooms} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
