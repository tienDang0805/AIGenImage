const express = require('express');
const { GoogleGenerativeAI, DynamicRetrievalMode } = require("@google/generative-ai");
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json({limit: '10mb'}));
const genAI = new GoogleGenerativeAI("AIzaSyA9M-FbFjdW_jVbrC8zPYE0xfptJZkLMtc");
// Define the model you wish to use (e.g., gemini-2.0-flash-exp)
const model = genAI.getGenerativeModel(
    {
      model: "models/gemini-2.0-flash-exp",
      // If using grounding
      tools: [
          {
              googleSearchRetrieval: {
                  dynamicRetrievalConfig: {
                  mode: DynamicRetrievalMode.MODE_DYNAMIC,
                  dynamicThreshold: 0.7,
                  },
              },
          },
      ],
    },
    { apiVersion: "v1beta" },
);


app.post('/gpt-chat', async (req, res) => {
  const { chatHistory, message } = req.body;

  try {
     
     
     chatHistory.push({
        "role": "user",
        "parts": [{
          "text": message
        }]
    });
        const requestBody = {
          "contents": chatHistory
        };
     
      const result = await model.generateContent(requestBody);

      const modelResponse = result.response.candidates[0].content.parts[0].text
    
      res.json({ modelResponse });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/gpt-chat-with-image', async (req, res) => {
  const { chatHistory, message, image } = req.body;

  try {
   
    chatHistory.push({
        "role": "user",
        "parts": [
          image,
           { "text": message }
        ]
      });
       const requestBody = {
          "contents": chatHistory
        };
     
        const result = await model.generateContent(requestBody);
        const modelResponse = result.response.candidates[0].content.parts[0].text
      res.json({ modelResponse });
  } catch (error) {
    console.error('Error processing image chat request:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});