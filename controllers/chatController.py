import os
import openai
import random
from flask import request, jsonify

# Ensure the OpenAI API key is configured from the environment
openai.api_key = os.getenv("OPENAI_API_KEY")

def ask_ai():
    """Handle chat requests to OpenAI or Fallback to Simulated AI"""
    data = request.json
    messages = data.get("messages", [])

    if not messages:
        return jsonify({"error": "Messages array is required"}), 400

    # Fallback to Simulated AI if no API key is present
    if not openai.api_key:
        last_message = messages[-1].get("content", "").lower()
        
        simulated_responses = [
            "Based on your facial structure, I highly recommend the 'Cyber Bob'. It frames the jawline perfectly.",
            "Our Chroma dye process uses metallic pigments that reflect light differently depending on the angle. Would you like to see the Lookbook?",
            "If you want to maintain volume, I suggest booking a Scalp Spa therapy session to rejuvenate the follicles.",
            "As an Aura Elite member, you receive priority booking for all master stylist sessions.",
            "I'm operating in simulated mode right now since my live neural net API key is not configured, but I can assure you our stylists are the best!"
        ]
        
        if "book" in last_message or "appointment" in last_message:
            reply = "You can easily book an appointment by clicking the 'Book Now' button in the navigation bar!"
        elif "price" in last_message or "cost" in last_message:
            reply = "Our Signature Precision Cuts start at $65. You can view full pricing in the Services menu."
        else:
            reply = random.choice(simulated_responses)
            
        return jsonify({"reply": reply}), 200

    # Enforce system prompt behavior for OpenAI
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
        return jsonify({"reply": "I'm experiencing interference connecting to my live neural net right now, but I assure you our master stylists are ready for you. Feel free to book an appointment!"}), 200
