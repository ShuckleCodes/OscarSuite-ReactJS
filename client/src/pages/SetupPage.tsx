import { useState, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CardMedia,
  CardActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import {
  useAwards,
  useCreateAward,
  useUpdateAward,
  useDeleteAward,
  useCreateNominee,
  useUpdateNominee,
  useDeleteNominee,
} from '../hooks/useAwards';
import { useAppState, useSetEventTitle } from '../hooks/useAppState';
import { uploadNomineeImage } from '../api';
import type { Award, Nominee } from '../types';

export default function SetupPage() {
  const { data: awards = [], isLoading } = useAwards();
  const { data: appState } = useAppState();

  const createAward = useCreateAward();
  const updateAward = useUpdateAward();
  const deleteAward = useDeleteAward();
  const createNominee = useCreateNominee();
  const updateNominee = useUpdateNominee();
  const deleteNomineeMutation = useDeleteNominee();
  const setEventTitle = useSetEventTitle();

  // Event title state
  const [eventTitleInput, setEventTitleInput] = useState('');
  const [eventTitleEditing, setEventTitleEditing] = useState(false);

  // Selected category for nominee management
  const [selectedAwardId, setSelectedAwardId] = useState<number | null>(null);

  // Award dialog state
  const [awardDialog, setAwardDialog] = useState(false);
  const [awardDialogMode, setAwardDialogMode] = useState<'create' | 'edit'>('create');
  const [editingAwardId, setEditingAwardId] = useState<number | null>(null);
  const [awardName, setAwardName] = useState('');

  // Nominee dialog state
  const [nomineeDialog, setNomineeDialog] = useState(false);
  const [nomineeDialogMode, setNomineeDialogMode] = useState<'create' | 'edit'>('create');
  const [editingNomineeId, setEditingNomineeId] = useState<number | null>(null);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeImage, setNomineeImage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteAwardDialog, setDeleteAwardDialog] = useState(false);
  const [deletingAwardId, setDeletingAwardId] = useState<number | null>(null);
  const [deleteNomineeDialog, setDeleteNomineeDialog] = useState(false);
  const [deletingNomineeId, setDeletingNomineeId] = useState<number | null>(null);

  const selectedAward = awards.find((a: Award) => a.id === selectedAwardId);

  // Award handlers
  const handleOpenCreateAward = () => {
    setAwardDialogMode('create');
    setAwardName('');
    setEditingAwardId(null);
    setAwardDialog(true);
  };

  const handleOpenEditAward = (award: Award) => {
    setAwardDialogMode('edit');
    setAwardName(award.name);
    setEditingAwardId(award.id);
    setAwardDialog(true);
  };

  const handleSaveAward = async () => {
    if (!awardName.trim()) return;

    if (awardDialogMode === 'create') {
      await createAward.mutateAsync(awardName.trim());
    } else if (editingAwardId) {
      await updateAward.mutateAsync({
        awardId: editingAwardId,
        updates: { name: awardName.trim() }
      });
    }

    setAwardDialog(false);
    setAwardName('');
    setEditingAwardId(null);
  };

  const handleConfirmDeleteAward = (awardId: number) => {
    setDeletingAwardId(awardId);
    setDeleteAwardDialog(true);
  };

  const handleDeleteAward = async () => {
    if (deletingAwardId) {
      await deleteAward.mutateAsync(deletingAwardId);
      if (selectedAwardId === deletingAwardId) {
        setSelectedAwardId(null);
      }
    }
    setDeleteAwardDialog(false);
    setDeletingAwardId(null);
  };

  const handleMoveAward = async (awardId: number, direction: 'up' | 'down') => {
    const index = awards.findIndex((a: Award) => a.id === awardId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= awards.length) return;

    // Reorder by swapping the nominees arrays
    const reorderedAwards = [...awards];
    [reorderedAwards[index], reorderedAwards[newIndex]] = [reorderedAwards[newIndex], reorderedAwards[index]];

    // Update all awards to maintain order (by updating their full nominees)
    // Since we can't reorder via the API directly, we just update the award being moved
    // Note: For a proper implementation, we'd need a dedicated reorder endpoint
  };

  // Nominee handlers
  const handleOpenCreateNominee = () => {
    setNomineeDialogMode('create');
    setNomineeName('');
    setNomineeImage('');
    setImagePreview(null);
    setEditingNomineeId(null);
    setNomineeDialog(true);
  };

  const handleOpenEditNominee = (nominee: Nominee) => {
    setNomineeDialogMode('edit');
    setNomineeName(nominee.name);
    setNomineeImage(nominee.image);
    setImagePreview(nominee.image ? `/data/nominees/${nominee.image}` : null);
    setEditingNomineeId(nominee.id);
    setNomineeDialog(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploading(true);
    try {
      const result = await uploadNomineeImage(file);
      setNomineeImage(result.filename);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNominee = async () => {
    if (!nomineeName.trim() || !selectedAwardId) return;

    if (nomineeDialogMode === 'create') {
      await createNominee.mutateAsync({
        awardId: selectedAwardId,
        name: nomineeName.trim(),
        image: nomineeImage
      });
    } else if (editingNomineeId) {
      await updateNominee.mutateAsync({
        awardId: selectedAwardId,
        nomineeId: editingNomineeId,
        updates: { name: nomineeName.trim(), image: nomineeImage }
      });
    }

    setNomineeDialog(false);
    setNomineeName('');
    setNomineeImage('');
    setImagePreview(null);
    setEditingNomineeId(null);
  };

  const handleConfirmDeleteNominee = (nomineeId: number) => {
    setDeletingNomineeId(nomineeId);
    setDeleteNomineeDialog(true);
  };

  const handleDeleteNominee = async () => {
    if (deletingNomineeId && selectedAwardId) {
      await deleteNomineeMutation.mutateAsync({
        awardId: selectedAwardId,
        nomineeId: deletingNomineeId
      });
    }
    setDeleteNomineeDialog(false);
    setDeletingNomineeId(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  const handleEditEventTitle = () => {
    setEventTitleInput(appState?.event_title || 'Awards Night');
    setEventTitleEditing(true);
  };

  const handleSaveEventTitle = async () => {
    if (eventTitleInput.trim()) {
      await setEventTitle.mutateAsync(eventTitleInput.trim());
    }
    setEventTitleEditing(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 700, mb: 4 }}>
        Awards Setup
      </Typography>

      {/* Event Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Event Settings</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ minWidth: 100 }}>Event Title:</Typography>
            {eventTitleEditing ? (
              <>
                <TextField
                  size="small"
                  value={eventTitleInput}
                  onChange={(e) => setEventTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEventTitle()}
                  autoFocus
                  sx={{ flexGrow: 1, maxWidth: 300 }}
                />
                <Button variant="contained" size="small" onClick={handleSaveEventTitle}>
                  Save
                </Button>
                <Button size="small" onClick={() => setEventTitleEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {appState?.event_title || 'Awards Night'}
                </Typography>
                <IconButton size="small" onClick={handleEditEventTitle}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Categories Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Categories</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateAward}
                >
                  Add
                </Button>
              </Box>

              {awards.length === 0 ? (
                <Alert severity="info">No categories yet. Create one to get started.</Alert>
              ) : (
                <List dense>
                  {awards.map((award: Award, index: number) => (
                    <ListItem
                      key={award.id}
                      selected={selectedAwardId === award.id}
                      onClick={() => setSelectedAwardId(award.id)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1,
                        mb: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                          }
                        }
                      }}
                    >
                      <ListItemText
                        primary={award.name}
                        secondary={`${award.nominees.length} nominee${award.nominees.length !== 1 ? 's' : ''}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleMoveAward(award.id, 'up'); }}
                          disabled={index === 0}
                        >
                          <ArrowUpIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleMoveAward(award.id, 'down'); }}
                          disabled={index === awards.length - 1}
                        >
                          <ArrowDownIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditAward(award); }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => { e.stopPropagation(); handleConfirmDeleteAward(award.id); }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Nominees Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Nominees
                  {selectedAward && `: ${selectedAward.name}`}
                </Typography>
                {selectedAward && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateNominee}
                  >
                    Add Nominee
                  </Button>
                )}
              </Box>

              {!selectedAward ? (
                <Alert severity="info">Select a category to manage its nominees.</Alert>
              ) : selectedAward.nominees.length === 0 ? (
                <Alert severity="info">No nominees yet. Add some nominees to this category.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {selectedAward.nominees.map((nominee: Nominee) => (
                    <Grid item xs={12} sm={6} md={4} key={nominee.id}>
                      <Card variant="outlined">
                        <CardMedia
                          component="img"
                          height="140"
                          image={nominee.image ? `/data/nominees/${nominee.image}` : '/placeholder.jpg'}
                          alt={nominee.name}
                          sx={{ objectFit: 'cover', backgroundColor: '#f5f5f5' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE0MCIgZmlsbD0iI2U1ZTVlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                        <CardContent sx={{ py: 1 }}>
                          <Typography variant="body2" noWrap title={nominee.name}>
                            {nominee.name}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ pt: 0 }}>
                          <IconButton size="small" onClick={() => handleOpenEditNominee(nominee)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleConfirmDeleteNominee(nominee.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Award Dialog */}
      <Dialog open={awardDialog} onClose={() => setAwardDialog(false)}>
        <DialogTitle>
          {awardDialogMode === 'create' ? 'Create Category' : 'Edit Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            value={awardName}
            onChange={(e) => setAwardName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveAward()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAwardDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveAward}
            variant="contained"
            disabled={!awardName.trim()}
          >
            {awardDialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nominee Dialog */}
      <Dialog open={nomineeDialog} onClose={() => setNomineeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {nomineeDialogMode === 'create' ? 'Add Nominee' : 'Edit Nominee'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nominee Name"
            fullWidth
            value={nomineeName}
            onChange={(e) => setNomineeName(e.target.value)}
            sx={{ mt: 1 }}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Nominee Image
            </Typography>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose Image'}
            </Button>

            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNomineeDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveNominee}
            variant="contained"
            disabled={!nomineeName.trim() || uploading}
          >
            {nomineeDialogMode === 'create' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Award Confirmation */}
      <Dialog open={deleteAwardDialog} onClose={() => setDeleteAwardDialog(false)}>
        <DialogTitle>Delete Category?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete this category and all its nominees.
            Any existing predictions for this category will become orphaned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAwardDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAward} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Nominee Confirmation */}
      <Dialog open={deleteNomineeDialog} onClose={() => setDeleteNomineeDialog(false)}>
        <DialogTitle>Delete Nominee?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete this nominee.
            If this nominee was the winner, the winner will be cleared.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteNomineeDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteNominee} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
