import { Router } from 'express';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const NOMINEES_DIR = path.join(process.cwd(), 'data', 'nominees');

function tmdbFetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// GET /api/tmdb/search/movie?query=...
router.get('/search/movie', async (req, res) => {
  try {
    const query = req.query.query as string;
    if (!query) return res.status(400).json({ error: 'query parameter required' });
    if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });

    const url = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const data = await tmdbFetch(url);
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('TMDB movie search error:', error);
    res.status(500).json({ error: 'TMDB search failed' });
  }
});

// GET /api/tmdb/search/person?query=...
router.get('/search/person', async (req, res) => {
  try {
    const query = req.query.query as string;
    if (!query) return res.status(400).json({ error: 'query parameter required' });
    if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });

    const url = `${TMDB_BASE}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const data = await tmdbFetch(url);
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('TMDB person search error:', error);
    res.status(500).json({ error: 'TMDB search failed' });
  }
});

// GET /api/tmdb/search/tv?query=...
router.get('/search/tv', async (req, res) => {
  try {
    const query = req.query.query as string;
    if (!query) return res.status(400).json({ error: 'query parameter required' });
    if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });

    const url = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const data = await tmdbFetch(url);
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('TMDB tv search error:', error);
    res.status(500).json({ error: 'TMDB search failed' });
  }
});

// POST /api/tmdb/download-image - Download image from TMDB and save locally
router.post('/download-image', async (req, res) => {
  try {
    const { imagePath } = req.body;
    if (!imagePath || typeof imagePath !== 'string') {
      return res.status(400).json({ error: 'imagePath is required' });
    }

    // Validate that imagePath looks like a TMDB path (starts with /)
    if (!imagePath.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid imagePath format' });
    }

    const ext = path.extname(imagePath) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(NOMINEES_DIR, filename);

    // Ensure directory exists
    if (!fs.existsSync(NOMINEES_DIR)) {
      fs.mkdirSync(NOMINEES_DIR, { recursive: true });
    }

    const imageUrl = `${TMDB_IMAGE_BASE}${imagePath}`;

    await new Promise<void>((resolve, reject) => {
      https.get(imageUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          const redirectUrl = response.headers.location;
          if (!redirectUrl) return reject(new Error('Redirect without location'));
          https.get(redirectUrl, (redirectResponse) => {
            const writeStream = fs.createWriteStream(filePath);
            redirectResponse.pipe(writeStream);
            writeStream.on('finish', () => { writeStream.close(); resolve(); });
            writeStream.on('error', reject);
          }).on('error', reject);
          return;
        }

        if (response.statusCode !== 200) {
          return reject(new Error(`Failed to download image: ${response.statusCode}`));
        }

        const writeStream = fs.createWriteStream(filePath);
        response.pipe(writeStream);
        writeStream.on('finish', () => { writeStream.close(); resolve(); });
        writeStream.on('error', reject);
      }).on('error', reject);
    });

    res.json({ filename });
  } catch (error) {
    console.error('TMDB image download error:', error);
    res.status(500).json({ error: 'Failed to download image' });
  }
});

export default router;
