// server.js
const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const fs = require('fs');
const pdf = require('pdf-parse');
const axios = require('axios');
// import dotenv from 'dotenv';
// dotenv.config();
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const cors = require('cors');
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());

async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdf(dataBuffer);
    return data.text;

  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

// Endpoint to upload resume
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  const resumePath = req.file.path;
  
  try {
    const resumeData = await extractTextFromPdf(resumePath); // Extract text from resume file
    res.json({ resumeData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract text from resume' });
  }
});


async function getAnswer(question, resumeData) {
  try {

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: "user", content: `Resume: ${resumeData}\nQuestion: ${question}` }],
        // max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}



// Endpoint to ask questions
app.post('/api/question', async (req, res) => {
  const { question, resumeData } = req.body;
  const answer = await getAnswer(question, resumeData); // NLP to process and answer question
  res.json({ answer });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
