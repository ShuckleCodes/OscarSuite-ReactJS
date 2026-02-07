import { useState, useRef, useEffect } from 'react';
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
  Tabs,
  Tab,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Search as SearchIcon,
  Collections as GalleryIcon,
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
import {
  uploadNomineeImage,
  searchTmdbMovies,
  searchTmdbPeople,
  searchTmdbTv,
  downloadTmdbImage,
  getNomineeImages,
} from '../api';
import type {
  TmdbMovieResult,
  TmdbPersonResult,
  TmdbTvResult,
} from '../api';
import type { Award, Nominee } from '../types';

type TmdbSearchType = 'movie' | 'person' | 'tv';
type TmdbResult = TmdbMovieResult | TmdbPersonResult | TmdbTvResult;

function getTmdbResultName(result: TmdbResult, type: TmdbSearchType): string {
  if (type === 'movie') return (result as TmdbMovieResult).title;
  return (result as TmdbPersonResult | TmdbTvResult).name;
}

function getTmdbResultImage(result: TmdbResult, type: TmdbSearchType): string | null {
  if (type === 'person') return (result as TmdbPersonResult).profile_path;
  return (result as TmdbMovieResult | TmdbTvResult).poster_path;
}

function getTmdbResultSubtitle(result: TmdbResult, type: TmdbSearchType): string {
  if (type === 'movie') {
    const m = result as TmdbMovieResult;
    return m.release_date ? m.release_date.substring(0, 4) : '';
  }
  if (type === 'person') {
    return (result as TmdbPersonResult).known_for_department || '';
  }
  const tv = result as TmdbTvResult;
  return tv.first_air_date ? tv.first_air_date.substring(0, 4) : '';
}

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

  // Set page title
  useEffect(() => {
    document.title = 'Setup - Awards Show Suite';
  }, []);

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
  const [nomineeSubHeading, setNomineeSubHeading] = useState('');
  const [nomineeImage, setNomineeImage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TMDB search state
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbSearchType, setTmdbSearchType] = useState<TmdbSearchType>('movie');
  const [tmdbSearchBy, setTmdbSearchBy] = useState<'name' | 'subheading'>('name');
  const [tmdbResults, setTmdbResults] = useState<TmdbResult[]>([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);

  // Gallery state
  const [showGallery, setShowGallery] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Auto-suggested images
  const [suggestedImages, setSuggestedImages] = useState<{ image: string; label: string }[]>([]);

  // Delete confirmation
  const [deleteAwardDialog, setDeleteAwardDialog] = useState(false);
  const [deletingAwardId, setDeletingAwardId] = useState<number | null>(null);
  const [deleteNomineeDialog, setDeleteNomineeDialog] = useState(false);
  const [deletingNomineeId, setDeletingNomineeId] = useState<number | null>(null);

  const selectedAward = awards.find((a: Award) => a.id === selectedAwardId);

  // Auto-suggest images when nominee name or sub-heading changes
  useEffect(() => {
    if (!nomineeDialog) return;
    const searchText = [nomineeName.toLowerCase(), nomineeSubHeading.toLowerCase()].filter(Boolean);
    if (searchText.every(s => !s)) {
      setSuggestedImages([]);
      return;
    }

    const suggestions: { image: string; label: string }[] = [];
    const seenImages = new Set<string>();

    for (const award of awards) {
      for (const nominee of award.nominees) {
        if (!nominee.image || seenImages.has(nominee.image)) continue;
        const nameMatch = searchText.some(s => nominee.name.toLowerCase().includes(s) || s.includes(nominee.name.toLowerCase()));
        const subMatch = nominee.subHeading && searchText.some(s => nominee.subHeading!.toLowerCase().includes(s) || s.includes(nominee.subHeading!.toLowerCase()));
        if (nameMatch || subMatch) {
          // Don't suggest the current nominee's own image when editing
          if (editingNomineeId && nominee.id === editingNomineeId) continue;
          seenImages.add(nominee.image);
          suggestions.push({
            image: nominee.image,
            label: `${nominee.name}${nominee.subHeading ? ` - ${nominee.subHeading}` : ''}`
          });
        }
      }
    }
    setSuggestedImages(suggestions);
  }, [nomineeName, nomineeSubHeading, awards, nomineeDialog, editingNomineeId]);

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
    setNomineeSubHeading('');
    setNomineeImage('');
    setImagePreview(null);
    setEditingNomineeId(null);
    setTmdbSearchQuery('');
    setTmdbResults([]);
    setSuggestedImages([]);
    setNomineeDialog(true);
  };

  const handleOpenEditNominee = (nominee: Nominee) => {
    setNomineeDialogMode('edit');
    setNomineeName(nominee.name);
    setNomineeSubHeading(nominee.subHeading || '');
    setNomineeImage(nominee.image);
    setImagePreview(nominee.image ? `/data/nominees/${nominee.image}` : null);
    setEditingNomineeId(nominee.id);
    setTmdbSearchQuery('');
    setTmdbResults([]);
    setSuggestedImages([]);
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

  const handleTmdbSearch = async () => {
    if (!tmdbSearchQuery.trim()) return;
    setTmdbSearching(true);
    try {
      let results: TmdbResult[];
      if (tmdbSearchType === 'movie') {
        const resp = await searchTmdbMovies(tmdbSearchQuery);
        results = resp.results;
      } else if (tmdbSearchType === 'person') {
        const resp = await searchTmdbPeople(tmdbSearchQuery);
        results = resp.results;
      } else {
        const resp = await searchTmdbTv(tmdbSearchQuery);
        results = resp.results;
      }
      setTmdbResults(results);
    } catch (error) {
      console.error('TMDB search failed:', error);
    } finally {
      setTmdbSearching(false);
    }
  };

  const handleTmdbSelect = async (result: TmdbResult) => {
    const name = getTmdbResultName(result, tmdbSearchType);
    const imagePath = getTmdbResultImage(result, tmdbSearchType);

    // Auto-fill name or sub-heading based on search mode
    if (tmdbSearchBy === 'name') {
      setNomineeName(name);
    } else {
      setNomineeSubHeading(name);
    }

    // Download and set image if available
    if (imagePath) {
      setUploading(true);
      try {
        const { filename } = await downloadTmdbImage(imagePath);
        setNomineeImage(filename);
        setImagePreview(`/data/nominees/${filename}`);
      } catch (error) {
        console.error('Failed to download TMDB image:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSelectExistingImage = (filename: string) => {
    setNomineeImage(filename);
    setImagePreview(`/data/nominees/${filename}`);
    setShowGallery(false);
  };

  const handleOpenGallery = async () => {
    try {
      const images = await getNomineeImages();
      setExistingImages(images);
      setShowGallery(true);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    }
  };

  const handleSaveNominee = async () => {
    if (!nomineeName.trim() || !selectedAwardId) return;

    if (nomineeDialogMode === 'create') {
      await createNominee.mutateAsync({
        awardId: selectedAwardId,
        name: nomineeName.trim(),
        image: nomineeImage,
        subHeading: nomineeSubHeading.trim() || undefined
      });
    } else if (editingNomineeId) {
      await updateNominee.mutateAsync({
        awardId: selectedAwardId,
        nomineeId: editingNomineeId,
        updates: {
          name: nomineeName.trim(),
          image: nomineeImage,
          subHeading: nomineeSubHeading.trim()
        }
      });
    }

    setNomineeDialog(false);
    setNomineeName('');
    setNomineeSubHeading('');
    setNomineeImage('');
    setImagePreview(null);
    setEditingNomineeId(null);
    setTmdbResults([]);
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
                          {nominee.subHeading && (
                            <Typography variant="caption" color="text.secondary" noWrap title={nominee.subHeading}>
                              {nominee.subHeading}
                            </Typography>
                          )}
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
      <Dialog open={nomineeDialog} onClose={() => setNomineeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {nomineeDialogMode === 'create' ? 'Add Nominee' : 'Edit Nominee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Left column: Name, Sub-heading, Image */}
            <Grid item xs={12} md={6}>
              <TextField
                autoFocus
                margin="dense"
                label="Nominee Name"
                fullWidth
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
                sx={{ mt: 1 }}
              />
              <TextField
                margin="dense"
                label="Sub-heading (optional)"
                fullWidth
                value={nomineeSubHeading}
                onChange={(e) => setNomineeSubHeading(e.target.value)}
                placeholder="e.g., movie title, show name"
                size="small"
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
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    Upload File
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<GalleryIcon />}
                    onClick={handleOpenGallery}
                  >
                    Browse Gallery
                  </Button>
                </Box>

                {/* Auto-suggested images */}
                {suggestedImages.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Suggested (from existing nominees):
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {suggestedImages.map((s) => (
                        <Box
                          key={s.image}
                          onClick={() => handleSelectExistingImage(s.image)}
                          sx={{
                            cursor: 'pointer',
                            border: nomineeImage === s.image ? '2px solid' : '1px solid',
                            borderColor: nomineeImage === s.image ? 'primary.main' : 'grey.300',
                            borderRadius: 1,
                            overflow: 'hidden',
                            width: 60,
                            height: 60,
                          }}
                          title={s.label}
                        >
                          <img
                            src={`/data/nominees/${s.image}`}
                            alt={s.label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {uploading && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">Downloading image...</Typography>
                  </Box>
                )}

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
            </Grid>

            {/* Right column: TMDB Search */}
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                TMDB Search
              </Typography>

              <RadioGroup
                row
                value={tmdbSearchBy}
                onChange={(e) => setTmdbSearchBy(e.target.value as 'name' | 'subheading')}
              >
                <FormControlLabel value="name" control={<Radio size="small" />} label="Fill Name" />
                <FormControlLabel value="subheading" control={<Radio size="small" />} label="Fill Sub-heading" />
              </RadioGroup>

              <Tabs
                value={tmdbSearchType}
                onChange={(_, v) => { setTmdbSearchType(v); setTmdbResults([]); }}
                sx={{ minHeight: 36, mb: 1 }}
              >
                <Tab value="movie" label="Movie" sx={{ minHeight: 36, py: 0 }} />
                <Tab value="person" label="Person" sx={{ minHeight: 36, py: 0 }} />
                <Tab value="tv" label="TV Show" sx={{ minHeight: 36, py: 0 }} />
              </Tabs>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Search TMDB..."
                  fullWidth
                  value={tmdbSearchQuery}
                  onChange={(e) => setTmdbSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTmdbSearch()}
                />
                <IconButton onClick={handleTmdbSearch} disabled={tmdbSearching || !tmdbSearchQuery.trim()}>
                  <SearchIcon />
                </IconButton>
              </Box>

              {tmdbSearching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {tmdbResults.length > 0 && (
                <List dense sx={{ maxHeight: 300, overflow: 'auto', mt: 1 }}>
                  {tmdbResults.slice(0, 10).map((result) => {
                    const imgPath = getTmdbResultImage(result, tmdbSearchType);
                    const thumbUrl = imgPath ? `https://image.tmdb.org/t/p/w92${imgPath}` : null;
                    return (
                      <ListItem
                        key={result.id}
                        onClick={() => handleTmdbSelect(result)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt=""
                              style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4 }}
                            />
                          ) : (
                            <Box sx={{ width: 40, height: 60, bgcolor: 'grey.200', borderRadius: 1 }} />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {getTmdbResultName(result, tmdbSearchType)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getTmdbResultSubtitle(result, tmdbSearchType)}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>
              )}

              {!tmdbSearching && tmdbResults.length === 0 && tmdbSearchQuery && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  No results. Try searching above.
                </Typography>
              )}
            </Grid>
          </Grid>
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

      {/* Gallery Dialog */}
      <Dialog open={showGallery} onClose={() => setShowGallery(false)} maxWidth="md" fullWidth>
        <DialogTitle>Image Gallery</DialogTitle>
        <DialogContent>
          {existingImages.length === 0 ? (
            <Alert severity="info">No images available yet.</Alert>
          ) : (
            <ImageList cols={4} gap={8}>
              {existingImages.map((img) => (
                <ImageListItem
                  key={img}
                  onClick={() => handleSelectExistingImage(img)}
                  sx={{
                    cursor: 'pointer',
                    border: nomineeImage === img ? '3px solid' : '1px solid',
                    borderColor: nomineeImage === img ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:hover': { opacity: 0.8 }
                  }}
                >
                  <img
                    src={`/data/nominees/${img}`}
                    alt={img}
                    loading="lazy"
                    style={{ height: 120, objectFit: 'cover' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGallery(false)}>Close</Button>
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
