import express from 'express';
import cors from 'cors';
// import { translate } from '@vitalets/google-translate-api';
import translate from 'google-translate-api-x';
// import autocomplete from 'autocomplete.js'
import axios from 'axios';

import wordListPath from 'word-list'
import fs from 'fs';
const wordArray = fs.readFileSync(wordListPath, 'utf-8').split('\n');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());



app.post('/translate', async (req, res) => {
  const { text, to } = req.body;
  console.log(req.body);
  try {
    const result = await translate(text, { to: to });
    res.json({ translatedText: result.text });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.post('/autocomplete', async (req, res) => {
  const input = req.body.req;
  console.log(input);
  
  const suggestions = wordArray
    .filter((w) => w.startsWith(input.toLowerCase()))
    .slice(0, 5);

  res.json({ hello: suggestions });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});