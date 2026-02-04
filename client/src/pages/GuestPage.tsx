import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  LinearProgress,
  Alert,
  Avatar,
  IconButton,
  Snackbar,
} from '@mui/material';
import { PhotoCamera, Tv } from '@mui/icons-material';
import { useAwards } from '../hooks/useAwards';
import { useGuests, useUpdateGuest } from '../hooks/useGuests';
import { useRooms } from '../hooks/useRooms';
import { useAppState } from '../hooks/useAppState';
import { useSocket } from '../context/SocketContext';
import { uploadPhoto } from '../api';
import type { Guest, Award } from '../types';
import AwardCard from '../components/guest/AwardCard';
import { Link } from 'react-router-dom';

export default function GuestPage() {
  const { data: awards = [] } = useAwards();
  const { data: guests = [], refetch: refetchGuests } = useGuests();
  const { data: rooms = [] } = useRooms();
  const { data: appState } = useAppState();
  const { sendMessage, on, off } = useSocket();

  const updateGuest = useUpdateGuest();

  const [selectedGuestId, setSelectedGuestId] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const selectedGuest = guests.find((g: Guest) => g.id === selectedGuestId);
  const predictionsLocked = appState?.predictions_locked ?? false;

  // Set page title
  useEffect(() => {
    document.title = 'Predictions - Awards Show Suite';
  }, []);

  // Calculate progress
  const completedCount = Object.values(predictions).filter(Boolean).length;
  const progressPercent = awards.length > 0 ? (completedCount / awards.length) * 100 : 0;
  const canSubmit = selectedGuestId !== null && completedCount > 0;

  // Load guest predictions when selected guest changes
  useEffect(() => {
    if (selectedGuest) {
      const guestPredictions: Record<number, number> = {};
      for (const [awardId, nomineeId] of Object.entries(selectedGuest.predictions || {})) {
        guestPredictions[Number(awardId)] = nomineeId;
      }
      setPredictions(guestPredictions);
      setSubmitted(false);
    } else {
      setPredictions({});
    }
  }, [selectedGuest]);

  // Listen for WebSocket events
  const handleMessage = useCallback((data: unknown) => {
    const message = data as string;
    const parts = message.split('+++');
    const action = parts[0];

    if (action === 'lockPredictions') {
      // Predictions locked - handled by appState query
    } else if (action === 'unlockPredictions') {
      // Predictions unlocked - handled by appState query
    } else if (action === 'guestsUpdated') {
      refetchGuests();
    }
  }, [refetchGuests]);

  useEffect(() => {
    on('message', handleMessage);
    return () => {
      off('message', handleMessage);
    };
  }, [on, off, handleMessage]);

  const handlePredictionChange = (awardId: number, nomineeId: number) => {
    setPredictions(prev => ({
      ...prev,
      [awardId]: nomineeId
    }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || predictionsLocked || !selectedGuestId) return;

    setSubmitting(true);
    try {
      // Convert predictions to string keys
      const predictionsData: Record<string, number> = {};
      for (const [awardId, nomineeId] of Object.entries(predictions)) {
        if (nomineeId) {
          predictionsData[String(awardId)] = nomineeId;
        }
      }

      await updateGuest.mutateAsync({
        guestId: selectedGuestId,
        updates: { predictions: predictionsData }
      });

      setSubmitted(true);
      setSnackbar({ open: true, message: 'Predictions saved successfully!', severity: 'success' });

      // Notify via WebSocket
      sendMessage(`guestSubmitted+++${selectedGuestId}+++${selectedGuest?.name || ''}`);
    } catch (error) {
      console.error('Error saving predictions:', error);
      setSnackbar({ open: true, message: 'Error saving predictions. Please try again.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedGuestId) return;

    setUploadingPhoto(true);
    try {
      const { path } = await uploadPhoto(file);

      await updateGuest.mutateAsync({
        guestId: selectedGuestId,
        updates: { photo: path }
      });

      await refetchGuests();
      setSnackbar({ open: true, message: 'Photo uploaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setSnackbar({ open: true, message: 'Error uploading photo. Please try again.', severity: 'error' });
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const getPhotoUrl = (photo: string | undefined) => {
    if (!photo) return '/data/backgrounds/trophy.png';
    return `/data/${photo}`;
  };

  const getRoomName = (code: string) => {
    const room = rooms.find(r => r.code === code);
    return room?.name || code;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Link to Display */}
      <Box sx={{ textAlign: 'right', mb: 2 }}>
        <Button
          component={Link}
          to="/display"
          startIcon={<Tv />}
          sx={{ color: 'primary.main' }}
        >
          View Display
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Awards Predictions
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Submit your predictions for tonight's awards
        </Typography>
      </Box>

      {/* Locked Alert */}
      {predictionsLocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Predictions are locked. You cannot make changes until the admin unlocks them.
        </Alert>
      )}

      {/* Guest Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedGuest && (
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={getPhotoUrl(selectedGuest.photo)}
                  sx={{ width: 80, height: 80 }}
                />
                <input
                  accept="image/*"
                  id="photo-upload"
                  type="file"
                  hidden
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto || predictionsLocked}
                />
                <label htmlFor="photo-upload">
                  <IconButton
                    component="span"
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'black',
                      '&:hover': { bgcolor: 'primary.light' }
                    }}
                    disabled={uploadingPhoto || predictionsLocked}
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                </label>
              </Box>
            )}

            <Box sx={{ flexGrow: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Select Your Name</InputLabel>
                <Select
                  value={selectedGuestId ?? ''}
                  label="Select Your Name"
                  onChange={(e) => setSelectedGuestId(e.target.value as number)}
                >
                  {guests.map((guest: Guest) => (
                    <MenuItem key={guest.id} value={guest.id}>
                      {guest.name}
                      {guest.predictions && Object.keys(guest.predictions).length > 0 && ' ✓'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {selectedGuest && selectedGuest.rooms && selectedGuest.rooms.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Rooms: {selectedGuest.rooms.map(getRoomName).join(', ')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {selectedGuestId && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedCount} / {awards.length} categories
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: 'grey.800',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main'
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Awards List */}
      {selectedGuestId && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {awards.map((award: Award) => (
            <AwardCard
              key={award.id}
              award={award}
              selectedNomineeId={predictions[award.id]}
              onSelect={(nomineeId) => handlePredictionChange(award.id, nomineeId)}
              disabled={predictionsLocked}
            />
          ))}
        </Box>
      )}

      {/* Submit Button */}
      {selectedGuestId && (
        <Box sx={{ position: 'sticky', bottom: 16, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!canSubmit || predictionsLocked || submitting}
            sx={{
              px: 6,
              py: 1.5,
              fontSize: '1.1rem',
              boxShadow: '0 4px 20px rgba(201, 162, 39, 0.4)'
            }}
          >
            {submitting ? 'Saving...' : submitted ? 'Update Predictions' : 'Submit Predictions'}
          </Button>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
