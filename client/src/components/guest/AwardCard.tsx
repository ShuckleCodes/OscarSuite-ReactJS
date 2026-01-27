import {
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Avatar,
} from '@mui/material';
import type { Award } from '../../types';

interface AwardCardProps {
  award: Award;
  selectedNomineeId: number | undefined;
  onSelect: (nomineeId: number) => void;
  disabled?: boolean;
}

export default function AwardCard({ award, selectedNomineeId, onSelect, disabled }: AwardCardProps) {
  const getImageUrl = (image: string) => {
    return `/data/nominees/${image}`;
  };

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            mb: 2,
            borderBottom: '1px solid',
            borderColor: 'primary.main',
            pb: 1
          }}
        >
          {award.name}
        </Typography>

        <RadioGroup
          value={selectedNomineeId ?? ''}
          onChange={(e) => onSelect(Number(e.target.value))}
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
      </CardContent>
    </Card>
  );
}
