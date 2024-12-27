import os
import json
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from flask import Flask, request, jsonify

# Lấy API key từ biến môi trường
API_KEY = os.getenv('GOOGLE_API_KEY')
if not API_KEY:
    raise ValueError("API key is not set in the environment variables")

MODEL_ID = 'gemini-2.0-flash-exp'  # Model ID

# Tạo client GenAI
client = genai.Client(api_key=API_KEY)

# Định nghĩa công cụ Google Search
google_search_tool = Tool(
    google_search=GoogleSearch()
)

# Khởi tạo Flask app
app = Flask(__name__)

@app.route('/gpt-chat', methods=['POST'])
def gpt_chat():
    try:
        # Nhận dữ liệu từ yêu cầu
        data = request.get_json()
        message = data.get('message', "What is the next total solar eclipse in the US?")
        chat_history = data.get('chatHistory', [])

        # Gọi API để tạo nội dung
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=message,
            config=GenerateContentConfig(
                tools=[google_search_tool],
                response_modalities=["TEXT"]
            )
        )

        # Ghi log kết quả đầy đủ để kiểm tra
        print("Raw Response: ", response)
        print("Candidates: ", response.candidates)

        # Trích xuất nội dung phản hồi
        generated_text = response.candidates[0].content.parts[0].text

        # Xử lý grounding_metadata để tránh lỗi JSON serializable
        grounding_metadata = response.candidates[0].grounding_metadata
        grounding_metadata_dict = None
        if grounding_metadata:
            try:
                grounding_metadata_dict = json.loads(grounding_metadata.to_json())
            except Exception as e:
                print(f"Failed to parse grounding_metadata: {e}")

        # Trả về kết quả dưới dạng JSON
        return jsonify({
            'generatedText': generated_text,
            'groundingMetadata': grounding_metadata_dict
        })

    except Exception as e:
        print(f"Error calling Google Generative AI API: {e}")
        return jsonify({'error': 'Failed to generate content'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
