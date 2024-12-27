from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from flask import Flask, request, jsonify

app = Flask(__name__)

# Replace with your actual API key
API_KEY = 'AIzaSyA9M-FbFjdW_jVbrC8zPYE0xfptJZkLMtc'  # Replace with your API key
MODEL_ID = 'gemini-2.0-flash-exp'  # Replace with your model ID

# Create a GenAI client
client = genai.Client()

# Define the Google Search tool
google_search_tool = Tool(
    google_search=GoogleSearch()
)

@app.route('/gpt-chat', methods=['POST'])
def gpt_chat():
    try:
        # Get prompt from request body, or use a default one
        data = request.get_json()
        message = data.get('message', "What is the next total solar eclipse in the US?")
        chat_history = data.get('chatHistory', [])
        
        # Generate content using Google GenAI
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=message,
            config=GenerateContentConfig(
                tools=[google_search_tool],
                response_modalities=["TEXT"]
            )
        )
        
        # Extract generated text
        generated_text = response.candidates[0].content.parts[0].text
        grounding_metadata = response.candidates[0].grounding_metadata
        
        # Return the result
        return jsonify({
            'generatedText': generated_text,
            'groundingMetadata': grounding_metadata or None
        })
    except Exception as e:
        print(f"Error calling Google Generative AI API: {e}")
        return jsonify({'error': 'Failed to generate content'}), 500

if __name__ == '__main__':
    app.run(port=3000)
