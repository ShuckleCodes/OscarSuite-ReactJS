import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Avatar,
  Collapse,
  IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import type { Award } from '../../types';

interface AwardCardProps {
  award: Award;
  selectedNomineeId: number | undefined;
  onSelect: (nomineeId: number) => void;
  disabled?: boolean;
}

export default function AwardCard({ award, selectedNomineeId, onSelect, disabled }: AwardCardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasSelection = selectedNomineeId !== undefined;
  const selectedNominee = award.nominees.find(n => n.id === selectedNomineeId);

  const getImageUrl = (image: string) => {
    return `/data/nominees/${image}`;
  };

  const handleHeaderClick = () => {
    if (hasSelection) {
      setExpanded(!expanded);
    }
  };

  const handleSelect = (nomineeId: number) => {
    onSelect(nomineeId);
    // Collapse after selection
    setExpanded(false);
  };

  // Show expanded if no selection or if manually expanded
  const showNominees = !hasSelection || expanded;

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardContent sx={{ pb: hasSelection && !expanded ? 2 : undefined }}>
        {/* Header - clickable when collapsed */}
        <Box
          onClick={handleHeaderClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: hasSelection ? 'pointer' : 'default',
            borderBottom: showNominees ? '1px solid' : 'none',
            borderColor: 'primary.main',
            pb: showNominees ? 1 : 0,
            mb: showNominees ? 2 : 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: hasSelection ? 'text.secondary' : 'primary.main',
              fontWeight: 600,
            }}
          >
            {award.name}
          </Typography>

          {hasSelection && (
            <IconButton size="small" sx={{ color: 'primary.main' }}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>

        {/* Collapsed view - show selected nominee */}
        {hasSelection && !expanded && selectedNominee && (
          <Box
            onClick={handleHeaderClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              py: 0.5,
            }}
          >
            <Avatar
              src={getImageUrl(selectedNominee.image)}
              alt={selectedNominee.name}
              sx={{ width: 40, height: 40 }}
              variant="rounded"
            >
              {selectedNominee.name[0]}
            </Avatar>
            <Typography sx={{ color: 'primary.main', fontWeight: 500 }}>
              {selectedNominee.name}
            </Typography>
          </Box>
        )}

        {/* Expanded view - show all nominees */}
        <Collapse in={showNominees}>
          <RadioGroup
            value={selectedNomineeId ?? ''}
            onChange={(e) => handleSelect(Number(e.target.value))}
          >
            {award.nominees.map((nominee) => (
              <FormControlLabel
                key={nominee.id}
                value={nominee.id}
                disabled={disabled}
                control={
                  <Radio
                    sx={{
                      color: 'grey.600',
                      '&.Mui-checked': {
                        color: 'primary.main'
                      }
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={getImageUrl(nominee.image)}
                      alt={nominee.name}
                      sx={{ width: 40, height: 40 }}
                      variant="rounded"
                    >
                      {nominee.name[0]}
                    </Avatar>
                    <Typography
                      sx={{
                        color: selectedNomineeId === nominee.id ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {nominee.name}
                    </Typography>
                  </Box>
                }
                sx={{
                  m: 0,
                  py: 1,
                  px: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  ...(selectedNomineeId === nominee.id && {
                    bgcolor: 'rgba(201, 162, 39, 0.1)'
                  })
                }}
              />
            ))}
          </RadioGroup>
        </Collapse>
      </CardContent>
    </Card>
  );
}
