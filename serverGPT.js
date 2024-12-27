const express = require('express');
const { GoogleGenerativeAI, DynamicRetrievalMode } = require("@google/generative-ai");
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Khởi tạo GoogleGenerativeAI với API key của bạn
const genAI = new GoogleGenerativeAI("AIzaSyA9M-FbFjdW_jVbrC8zPYE0xfptJZkLMtc");

// Model cấu hình sử dụng Google Search tools
const model = genAI.getGenerativeModel(
    {
        model: "models/gemini-2.0-pro",
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

// Hàm delay để tránh timeout request
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Endpoint xử lý chat
app.post('/gpt-chat', async (req, res) => {
    const { message } = req.body;

    console.log("\n--- Request Received ---");
    console.log("Message:", message); // Log tin nhắn nhận được

    try {
        // Gửi request đến model
        const result = await model.generateContent(message);

        console.log("\n--- Full Model Response ---");
        console.log(JSON.stringify(result, null, 2)); // Log toàn bộ phản hồi từ model

        // Trích xuất phản hồi từ model
        const modelResponse = result.response.candidates[0].content.parts[0].text;
        const groundingMetadata = result.response.candidates[0].groundingMetadata;

        console.log("\n--- Model Response ---");
        console.log("Text Response:", modelResponse); // Log nội dung phản hồi
        console.log("Grounding Metadata:", groundingMetadata); // Log thông tin tìm kiếm trên Google

        // Trả kết quả về client
        res.json({ modelResponse, groundingMetadata });
    } catch (error) {
        console.error('\nError processing chat request:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Endpoint xử lý chat với hình ảnh
app.post('/gpt-chat-with-image', async (req, res) => {
    const { message, image } = req.body;

    console.log("\n--- Request Received with Image ---");
    console.log("Message:", message);
    console.log("Image (base64):", image.substring(0, 50) + '...'); // Log 50 ký tự đầu của ảnh

    try {
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { mimeType: "image/jpeg", data: image } },
                        { text: message }
                    ]
                }
            ]
        };

        console.log("\n--- Request Body Sent ---");
        console.log(JSON.stringify(requestBody, null, 2));

        // Gửi request đến model
        await delay(1000); // Delay 1 giây
        const result = await model.generateContent(requestBody);

        console.log("\n--- Full Model Response ---");
        console.log(JSON.stringify(result, null, 2)); // Log toàn bộ phản hồi từ model

        // Trích xuất phản hồi từ model
        const modelResponse = result.response.candidates[0].content.parts[0].text;

        console.log("\n--- Model Response ---");
        console.log("Text Response:", modelResponse); // Log nội dung phản hồi

        // Trả kết quả về client
        res.json({ modelResponse });
    } catch (error) {
        console.error('\nError processing image chat request:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
