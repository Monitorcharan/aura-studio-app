from flask import Blueprint
from controllers.chatController import ask_ai

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat_with_ai():
    return ask_ai()
