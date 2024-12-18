const express = require('express');
const { GoogleGenerativeAI, DynamicRetrievalMode } = require("@google/generative-ai");
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

const genAI = new GoogleGenerativeAI("AIzaSyA9M-FbFjdW_jVbrC8zPYE0xfptJZkLMtc"); // Thay bằng API key của bạn
// Define the model you wish to use (e.g., gemini-2.0-flash-exp)
const model = genAI.getGenerativeModel(
    {
        model: "models/gemini-2.0-flash-exp",
         // Bỏ googleSearchRetrieval nếu không cần thiết
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

// Function to add a delay
const delay = (ms) => new Promise(res => setTimeout(res, ms));


app.post('/gpt-chat', async (req, res) => {
    const { chatHistory, message } = req.body;

    // Log incoming request
    console.log("Received /gpt-chat request:");
    console.log("Chat History:", JSON.stringify(chatHistory, null, 2));
    console.log("Message:", message);

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

        console.log("Request to model:", JSON.stringify(requestBody, null, 2));
         // Delay request
        await delay(1000); // Delay 1 second (có thể tăng lên nếu vẫn bị lỗi 429)

        const result = await model.generateContent(requestBody);

        const modelResponse = result.response.candidates[0].content.parts[0].text;

        // Log result from model
        console.log("Model Response:", modelResponse);

        res.json({ modelResponse });
    } catch (error) {
        console.error('Error processing chat request:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.post('/gpt-chat-with-image', async (req, res) => {
    const { chatHistory, message, image } = req.body;

    // Log incoming request
    console.log("Received /gpt-chat-with-image request:");
    console.log("Chat History:", JSON.stringify(chatHistory, null, 2));
    console.log("Message:", message);
    console.log("Image:", image);

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
        console.log("Request to model:", JSON.stringify(requestBody, null, 2));
        
         // Delay request
        await delay(1000); // Delay 1 second

        const result = await model.generateContent(requestBody);

        const modelResponse = result.response.candidates[0].content.parts[0].text;

        // Log result from model
        console.log("Model Response:", modelResponse);

        res.json({ modelResponse });
    } catch (error) {
        console.error('Error processing image chat request:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});