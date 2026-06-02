import os
import openai
from flask import request, jsonify

# Ensure the OpenAI API key is configured from the environment
openai.api_key = os.getenv("OPENAI_API_KEY")

def ask_ai():
    """Handle chat requests to OpenAI"""
    if not openai.api_key:
        return jsonify({"error": "OpenAI API key not configured on the server."}), 500

    data = request.json
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "Messages array is required"}), 400

    # Enforce system prompt behavior
    system_prompt = {
        "role": "system",
        "content": (
            "You are Aura Studio's highly professional, expert AI hair stylist and concierge. "
            "You provide styling advice, recommend haircuts (like the Cyber Bob, Neon Fringe, Volume Waves), "
            "and answer questions about face shapes, hair health, and salon services. "
            "Always maintain a premium, futuristic, and helpful tone. Keep responses concise and engaging."
        )
    }

    # Prepend the system prompt if not present
    if not any(m.get("role") == "system" for m in messages):
        messages.insert(0, system_prompt)

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )
        
        reply = response.choices[0].message['content']
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
