import { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import type { Award } from '../../types';

interface LogoScreenProps {
  awards: Award[];
}

export default function LogoScreen({ awards }: LogoScreenProps) {
  const [currentAward, setCurrentAward] = useState<Award | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const lastAwardIndex = useRef(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start random category display after 10 seconds
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      showRandomCategory();
      intervalRef.current = setInterval(showRandomCategory, 40000);
    }, 10000);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [awards]);

  const showRandomCategory = () => {
    if (awards.length === 0) return;

    // Pick a random award different from last one
    let randomIndex: number;
    if (awards.length > 1) {
      do {
        randomIndex = Math.floor(Math.random() * awards.length);
      } while (randomIndex === lastAwardIndex.current);
    } else {
      randomIndex = 0;
    }
    lastAwardIndex.current = randomIndex;

    // Fade out, then update and fade in
    setIsVisible(false);
    setTimeout(() => {
      setCurrentAward(awards[randomIndex]);
      setIsVisible(true);
    }, 800);
  };

  const getImageUrl = (image: string) => `/data/nominees/${image}`;

  // Calculate responsive width based on number of nominees
  // If more than 5 nominees, they'll be split into 2 rows
  const getNomineeWidth = (nomineeCount: number) => {
    const itemsPerRow = nomineeCount > 5 ? Math.ceil(nomineeCount / 2) : nomineeCount;
    // Reduce base width for 2-row layout to fit on screen
    const maxWidth = nomineeCount > 5 ? 12 : 17;
    const baseWidth = Math.min(maxWidth, 85 / itemsPerRow);
    return `${baseWidth}vw`;
  };

  const getNomineeHeight = (nomineeCount: number) => {
    const itemsPerRow = nomineeCount > 5 ? Math.ceil(nomineeCount / 2) : nomineeCount;
    const maxWidth = nomineeCount > 5 ? 12 : 17;
    const baseWidth = Math.min(maxWidth, 85 / itemsPerRow);
    // 2:3 aspect ratio (width:height)
    return `${baseWidth * 1.5}vw`;
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundImage: 'url(/data/backgrounds/bg-logo.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
     {/*  Logo
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <Box
          component="img"
          src="/data/backgrounds/trophy.png"
          alt="Trophy"
          sx={{
            width: 200,
            height: 'auto',
            filter: 'drop-shadow(0 0 30px rgba(201, 162, 39, 0.5))'
          }}
        />
      </motion.div>
 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{
          position: 'absolute',
          top: '15%',
          left: 0,
          right: 0,
          textAlign: 'center'
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: 'primary.main',
            fontWeight: 700,
            textShadow: '0 0 20px rgba(201, 162, 39, 0.5)'
          }}
        >
          Awards Night
        </Typography>
      </motion.div>

      {/* Random Category Display */}
      <AnimatePresence>
        {isVisible && currentAward && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              top: '30%',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: 'primary.main',
                mb: 3,
                fontWeight: 600,
                textShadow: '0 0 10px rgba(201, 162, 39, 0.3)',
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                px: 3,
                py: 1,
                borderRadius: 2
              }}
            >
              {currentAward.name}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: '1vw',
                flexWrap: 'wrap',
                justifyContent: 'center',
                // Limit width to force 2 rows when more than 5 nominees
                maxWidth: currentAward.nominees.length > 5
                  ? `${(Math.ceil(currentAward.nominees.length / 2) * 18)}vw`
                  : '95%'
              }}
            >
              {currentAward.nominees.map((nominee, index) => (
                <motion.div
                  key={nominee.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Box
                    sx={{
                      width: getNomineeWidth(currentAward.nominees.length),
                      textAlign: 'center'
                    }}
                  >
                    <Box
                      component="img"
                      src={getImageUrl(nominee.image)}
                      alt={nominee.name}
                      sx={{
                        width: '100%',
                        height: getNomineeHeight(currentAward.nominees.length),
                        objectFit: 'cover',
                        borderRadius: '0.5vw',
                        border: '0.2vw solid',
                        borderColor: 'primary.main',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                      }}
                    />
                    <Typography
                      sx={{
                        color: 'white',
                        mt: 1,
                        fontWeight: 500,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontSize: 'clamp(0.7rem, 1vw, 1.2rem)'
                      }}
                    >
                      {nominee.name}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
