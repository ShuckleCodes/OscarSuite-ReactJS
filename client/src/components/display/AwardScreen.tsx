import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { Award, GuestWithScore } from '../../types';

interface AwardScreenProps {
  award: Award;
  guests: GuestWithScore[];
  winnerId: number | null;
}

export default function AwardScreen({ award, guests, winnerId }: AwardScreenProps) {
  const getImageUrl = (image: string) => `/data/nominees/${image}`;
  const getGuestPhotoUrl = (photo: string) => {
    if (!photo) return '/data/backgrounds/trophy.png';
    return `/data/${photo}`;
  };

  // Get predictors for each nominee
  const getPredictors = (nomineeId: number) => {
    return guests.filter(g => g.predictions[award.id] === nomineeId);
  };

  // Calculate responsive width based on number of nominees
  // If more than 5 nominees, they'll be split into 2 rows
  const nomineeCount = award.nominees.length;
  const itemsPerRow = nomineeCount > 5 ? Math.ceil(nomineeCount / 2) : nomineeCount;
  // Reduce base width for 2-row layout to fit on screen
  const maxWidth = nomineeCount > 5 ? 12 : 17;
  const baseWidth = Math.min(maxWidth, 85 / itemsPerRow);
  const nomineeWidth = `${baseWidth}vw`;
  // 2:3 aspect ratio (width:height)
  const nomineeHeight = `${baseWidth * 1.5}vw`;

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
        alignItems: 'center',
        padding: '40px',
        overflow: 'hidden',
        backgroundImage: 'url(/data/backgrounds/bg-award.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Award Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <Typography
          variant="h2"
          sx={{
            color: 'primary.main',
            fontWeight: 700,
            textAlign: 'center',
            mb: 4,
            textShadow: '0 0 20px rgba(201, 162, 39, 0.5)'
          }}
        >
          {award.name}
        </Typography>
      </motion.div>

      {/* Nominees Grid */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'center',
          gap: '1vw',
          // Limit width to force 2 rows when more than 5 nominees
          maxWidth: nomineeCount > 5 ? `${itemsPerRow * 18}vw` : '95%',
          flex: 1,
          alignItems: 'center'
        }}
      >
        {award.nominees.map((nominee, index) => {
          const isWinner = winnerId === nominee.id;
          const predictors = getPredictors(nominee.id);

          return (
            <motion.div
              key={nominee.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: isWinner ? 1.1 : 1
              }}
              transition={{
                duration: 0.6,
                delay: index * 2, // 2 second stagger
                ease: 'easeOut'
              }}
            >
              <Box
                sx={{
                  width: nomineeWidth,
                  textAlign: 'center',
                  position: 'relative',
                  ...(isWinner && {
                    animation: 'winnerGlow 1.5s ease-in-out infinite'
                  })
                }}
              >
                {/* Nominee Image */}
                <Box
                  component="img"
                  src={getImageUrl(nominee.image)}
                  alt={nominee.name}
                  sx={{
                    width: '100%',
                    height: nomineeHeight,
                    objectFit: 'cover',
                    borderRadius: '0.5vw',
                    border: '0.2vw solid',
                    borderColor: isWinner ? 'primary.main' : 'grey.700',
                    boxShadow: isWinner
                      ? '0 0 30px rgba(201, 162, 39, 0.8)'
                      : '0 4px 20px rgba(0, 0, 0, 0.5)'
                  }}
                />

                {/* Nominee Name */}
                <Typography
                  sx={{
                    color: isWinner ? 'primary.main' : 'white',
                    mt: 1,
                    fontWeight: isWinner ? 700 : 500,
                    textShadow: isWinner ? '0 0 10px rgba(201, 162, 39, 0.5)' : 'none',
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: 'clamp(0.7rem, 1vw, 1.2rem)'
                  }}
                >
                  {nominee.name}
                </Typography>

                {/* Predictor Avatars */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '0.3vw',
                    mt: 1,
                    minHeight: '2.5vw'
                  }}
                >
                  {predictors.map((guest, guestIndex) => (
                    <motion.div
                      key={guest.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: (award.nominees.length - 1) * 2 + 1 + guestIndex * 0.1 // After all nominees appear
                      }}
                    >
                      <Box
                        component="img"
                        src={getGuestPhotoUrl(guest.photo)}
                        alt={guest.name}
                        title={guest.name}
                        sx={{
                          width: '2vw',
                          height: '2vw',
                          borderRadius: '50%',
                          border: '0.15vw solid',
                          borderColor: isWinner ? 'success.main' : 'grey.600',
                          objectFit: 'cover'
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </motion.div>
          );
        })}
      </Box>

    </motion.div>
  );
}
