const express = require('express');
const next = require('next');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const { Configuration, OpenAIApi } = require('openai');
const OpenAI = require('openai');

require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below

const nextApp = next({ dev, hostname, port });
const nextHandler = nextApp.getRequestHandler();

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const uploadsDir = path.join(__dirname, '../public/uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Express route for file uploads
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const otherParams = req.body;
  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const maxTokens = 4000;
    const base64Image = encodeImageToBase64(req.file.path);
    const imagePath = `data:image/jpeg;base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Carefully examine the image provided and return a neatly formatted JSON output containing a list of objects. Each object should contain:
              json
              
                {
                  "panelName": "",
                  "amountPerServing": {"value": "", "uom": ""},
                  "servingSize": {"value": "", "uom": ""},
                  "servingPerContainer": {"value": "", "uom": ""},
                  "nutrients": [{"name": "", "value": "", "uom": "", "dailyvalue": ""}],
                  "note": "",
                  "ingredients": ""
                }
              
            
              important that in your response to me only contain the object info
              `,
            },
            {
              type: 'image_url',
              image_url: { url: imagePath },
            },
          ],
        },
      ],
      temperature: 1,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const result = response.choices[0]?.message;

    // console.log('response', response.choices[0].message);
    res.json({ result, image: imagePath });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).send('Failed to generate text');
  }
});

app.get('/api/upload', (req, res) => {
  console.log('get');
  res.send('test');
});

app.use((req, res) => nextHandler(req, res));

nextApp.prepare().then(() => {
  app.listen(port, async () => {
    console.log(`Next.js App URL: ${process.env.NEXT_PUBLIC_SERVER_URL}`);
  });
});

// Function to encode image to Base64
const encodeImageToBase64 = (filePath) => {
  // Ensure the file path is absolute or correctly relative
  const absolutePath = path.resolve(filePath);
  // Read the file's buffer
  const fileBuffer = fs.readFileSync(absolutePath);
  // Convert the file's buffer to a Base64 string
  const base64Image = fileBuffer.toString('base64');
  return base64Image;
};
