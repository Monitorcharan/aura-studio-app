import os
import openai
import random
from flask import request, jsonify

# Ensure the OpenAI API key is configured from the environment
openai.api_key = os.getenv("OPENAI_API_KEY")
openai_base = os.getenv("OPENAI_API_BASE")
if openai_base:
    openai.api_base = openai_base

def get_simulated_response(last_message):
    last_message = last_message.lower()
    simulated_responses = [
        "Based on your facial structure, I highly recommend the 'Cyber Bob'. It frames the jawline perfectly.",
        "Our Chroma dye process uses metallic pigments that reflect light differently depending on the angle. Would you like to see the Lookbook?",
        "If you want to maintain volume, I suggest booking a Scalp Spa therapy session to rejuvenate the follicles.",
        "As an Aura Elite member, you receive priority booking for all master stylist sessions.",
        "Our precision cuts are designed to perfectly match your natural hair fall and texture.",
        "I'm operating in simulated mode right now, but I can assure you our master stylists are ready to elevate your aesthetic!"
    ]
    
    if "book" in last_message or "appointment" in last_message:
        return "You can easily book an appointment by clicking the 'Book Now' button in the navigation bar!"
    elif "price" in last_message or "cost" in last_message:
        return "Our Signature Precision Cuts start at $65. You can view full pricing in the Services menu."
    else:
        return random.choice(simulated_responses)

def ask_ai():
    """Handle chat requests to OpenAI or Fallback to Simulated AI"""
    data = request.json
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "Messages array is required"}), 400

    last_message_text = messages[-1].get("content", "")

    # Fallback to Simulated AI if no API key is present
    if not openai.api_key:
        return jsonify({"reply": get_simulated_response(last_message_text)}), 200

    # Clean the messages list to ensure it's valid for LLMs:
    # 1. It must alternate starting with 'user'
    # 2. Leading 'assistant' messages must be removed
    cleaned_messages = []
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content")
        if not role or not content:
            continue
        # Skip system prompts sent by client (we will inject our own)
        if role == "system":
            continue
        cleaned_messages.append({"role": role, "content": content})

    # Remove any leading assistant messages (like the greeting)
    while cleaned_messages and cleaned_messages[0]["role"] == "assistant":
        cleaned_messages.pop(0)

    if not cleaned_messages:
        return jsonify({"reply": get_simulated_response(last_message_text)}), 200

    # Prepend the system prompt as the first message
    system_prompt = {
        "role": "system",
        "content": (
            "You are Aura Studio's highly professional, expert AI hair stylist and concierge. "
            "You provide styling advice, recommend haircuts (like the Cyber Bob, Neon Fringe, Volume Waves), "
            "and answer questions about face shapes, hair health, and salon services. "
            "Always maintain a premium, futuristic, and helpful tone. Keep responses concise and engaging."
        )
    }
    cleaned_messages.insert(0, system_prompt)

    try:
        response = openai.ChatCompletion.create(
            model=os.getenv("AI_CHAT_MODEL", "gpt-3.5-turbo"),
            messages=cleaned_messages,
            max_tokens=300,
            temperature=0.7,
            headers={
                "HTTP-Referer": "https://aura-studio-app.onrender.com",
                "X-Title": "Aura Studio"
            }
        )
        
        reply = response.choices[0].message['content']
        return jsonify({"reply": reply}), 200
    except Exception as e:
        print("AI Chat API Error:", e)
        return jsonify({"reply": get_simulated_response(last_message_text)}), 200
