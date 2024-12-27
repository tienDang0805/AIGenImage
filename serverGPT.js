const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Thay thế bằng API Key thực tế của bạn
const API_KEY = 'YOUR_API_KEY';  // Thay thế với API Key của bạn
const MODEL_ID = 'gemini-2.0-flash-exp';  // Thay thế với ID model của bạn
const URL = `https://generativeai.googleapis.com/v1/models/${MODEL_ID}:generateContent`;

// Sử dụng body-parser để parse JSON request
app.use(bodyParser.json());

// API nhận request và gửi phản hồi từ Google Generative AI
app.post('/gpt-chat', async (req, res) => {
  // Lấy prompt từ request body, nếu không có prompt thì sẽ sử dụng prompt mặc định
  const { chatHistory, message } = req.body;
  const prompt = message|| "What is the next total solar eclipse in the US?";
  console.log("prompt",prompt)
  const payload = {
    contents: prompt,
    config: {
      tools: [
        { google_search: {} }
      ],
      response_modalities: ["TEXT"]
    }
  };

  try {
    // Gửi request đến Google Generative AI API
    const response = await axios.post(URL, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Trả lại nội dung được tạo từ Google Generative AI
    const generatedText = response.data.candidates[0].content.parts[0].text;
    console.log("generatedText: ", generatedText)
    const groundingMetadata = response.data.candidates[0].grounding_metadata;
    console.log("groundingMetadata: ", groundingMetadata)

    // Gửi kết quả về client
    res.json({
      generatedText: generatedText,
      groundingMetadata: groundingMetadata || null
    });
  } catch (error) {
    console.error('Error calling Google Generative AI API:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
