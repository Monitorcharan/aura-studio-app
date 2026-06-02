import json
import os
import re
from flask import jsonify, request

FACE_STYLE_MAP = {
    'round': [
        {
            'title': 'Textured Pompadour',
            'why': 'Adds height and length to balance a round face while keeping the sides cleaner.',
            'maintenance': 'Medium upkeep: daily styling with paste or pomade.'
        },
        {
            'title': 'Side-Swept Crop',
            'why': 'Creates soft angles and forward movement without adding width.',
            'maintenance': 'Low-to-medium upkeep with a quick daily brush and texturizing product.'
        },
        {
            'title': 'Long Fringe with Volume',
            'why': 'Helps visually lengthen the face and maintain stylish balance.',
            'maintenance': 'Medium upkeep; requires regular trims and morning styling.'
        }
    ],
    'square': [
        {
            'title': 'Textured Crop',
            'why': 'Softens hard jawlines with natural texture and a relaxed top.',
            'maintenance': 'Low upkeep; just a quick tousle and light product.'
        },
        {
            'title': 'Curtain Fringe',
            'why': 'Breaks the square angles and adds a softer finish around the face.',
            'maintenance': 'Medium upkeep, especially if you keep the fringe longer.'
        },
        {
            'title': 'Loose Undercut',
            'why': 'Keeps strong structure while preventing the look from appearing too sharp.',
            'maintenance': 'Medium upkeep with styling cream and occasional trims.'
        }
    ],
    'oval': [
        {
            'title': 'Classic Pompadour',
            'why': 'Works well with balanced proportions and gives a polished silhouette.',
            'maintenance': 'Medium upkeep with product and regular shaping.'
        },
        {
            'title': 'Modern Quiff',
            'why': 'Offers structure with movement and suits the natural symmetry of an oval face.',
            'maintenance': 'Medium upkeep; use a matte paste for a natural finish.'
        },
        {
            'title': 'Textured Crop',
            'why': 'A versatile option that complements most textures and lifestyles.',
            'maintenance': 'Low-to-medium upkeep with minimal styling.'
        }
    ],
    'heart': [
        {
            'title': 'Soft Fringe',
            'why': 'Balances a wider forehead while drawing attention toward the eyes.',
            'maintenance': 'Medium upkeep with light styling product.'
        },
        {
            'title': 'Tapered Side Part',
            'why': 'Creates a refined shape that supports a narrower jawline.',
            'maintenance': 'Low-to-medium upkeep with simple comb styling.'
        },
        {
            'title': 'Textured Crop',
            'why': 'Keeps the overall silhouette grounded and avoids too much top heaviness.',
            'maintenance': 'Low upkeep with dry texture paste.'
        }
    ],
    'diamond': [
        {
            'title': 'Layered Top',
            'why': 'Adds width at the temples while preserving strong bone structure.',
            'maintenance': 'Medium upkeep with texture spray or paste.'
        },
        {
            'title': 'Curly Crop',
            'why': 'Uses natural texture to soften the angular shape and add balance.',
            'maintenance': 'Low-to-medium upkeep depending on curl care routine.'
        },
        {
            'title': 'Slicked Back Undercut',
            'why': 'Highlights the face shape while keeping the sides neat.',
            'maintenance': 'Higher upkeep; best for those who enjoy styling daily.'
        }
    ]
}

HAIRLINE_STYLE_MAP = {
    'receding': [
        'Caesar Cut',
        'Textured Crop',
        'Buzz Cut'
    ],
    'high': [
        'Pompadour',
        'Slicked Back',
        'Quiff'
    ],
    'normal': [
        'Textured Crop',
        'Classic Side Part',
        'Modern Quiff'
    ]
}

MAINTENANCE_STYLE_MAP = {
    'low': [
        'Buzz Cut',
        'Textured Crop',
        'Short Crop'
    ],
    'medium': [
        'Pompadour',
        'Curtain Fringe',
        'Modern Quiff'
    ],
    'high': [
        'Slicked Back',
        'Classic Side Part',
        'Volume Top'
    ]
}


def build_prompt(inputs: dict) -> str:
    return (
        "You are an expert hairstylist and aesthetic consultant. "
        "A user has provided the following details: "
        f"face shape: {inputs['faceShape']}, "
        f"hair density: {inputs['hairDensity']}, "
        f"hair texture: {inputs['hairTexture']}, "
        f"hairline type: {inputs['hairline']}, "
        f"maintenance preference: {inputs['maintenance']}. "
        "Recommend exactly three haircut styles and explain why each one is a good fit for the user. "
        "Also provide a short maintenance note for each style. "
        "Respond using valid JSON only, with keys: recommendations (array), summary (string). "
        "Each recommendation item should include title, why, and maintenance."
    )


def parse_json_response(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        cleaned = re.sub(r'```json|```', '', raw).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {}


def local_recommendation(inputs: dict) -> dict:
    face_shape = inputs['faceShape']
    hairline = inputs['hairline']
    maintenance = inputs['maintenance']
    guide = FACE_STYLE_MAP.get(face_shape, FACE_STYLE_MAP['oval'])

    extra_styles = []
    if hairline == 'receding':
        extra_styles = [
            {
                'title': 'Caesar Cut',
                'why': 'A short fringe helps conceal a receding hairline and creates a clean, modern look.',
                'maintenance': 'Low upkeep with a simple morning styling routine.'
            },
            {
                'title': 'Textured Crop',
                'why': 'Natural texture softens the hairline and keeps the silhouette light.',
                'maintenance': 'Low upkeep with matte styling paste.'
            }
        ]
    elif maintenance == 'low':
        extra_styles = [
            {
                'title': 'Buzz Cut',
                'why': 'Minimal styling and strong shape make this ideal for low-maintenance routines.',
                'maintenance': 'Very low upkeep; just keep it trimmed regularly.'
            }
        ]

    recommendations = []
    for item in guide[:2]:
        recommendations.append(item)
    if extra_styles:
        recommendations.append(extra_styles[0])
    else:
        recommendations.append(guide[2])

    return {
        'recommendations': recommendations,
        'summary': 'These styles were selected to respect your face shape, hairline, and preferred maintenance level.',
        'source': 'fallback'
    }


def call_openai_recommendation(inputs: dict) -> dict:
    try:
        import openai
    except ImportError as exc:
        raise RuntimeError('OpenAI SDK is not installed') from exc

    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY is not configured')

    openai.api_key = api_key
    prompt = build_prompt(inputs)

    response = openai.ChatCompletion.create(
        model='gpt-4o',
        messages=[
            {'role': 'system', 'content': 'You are a master hairstylist and aesthetic consultant with deep knowledge of face shapes and hair behavior.'},
            {'role': 'user', 'content': prompt}
        ],
        temperature=0.7,
        max_tokens=500,
        n=1
    )

    raw_text = response.choices[0].message['content']
    candidates = parse_json_response(raw_text)
    if not candidates.get('recommendations'):
        raise ValueError('OpenAI response format invalid')
    candidates['source'] = 'OpenAI'
    return candidates


def call_openai_detection(image_data: str) -> dict:
    try:
        import openai
    except ImportError as exc:
        raise RuntimeError('OpenAI SDK is not installed') from exc

    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY is not configured')

    openai.api_key = api_key
    prompt_text = (
        'You are an expert facial physiognomy analyst and master hairstylist. '
        'I have provided an image of a person. Please perform a highly accurate analysis of their facial features and hair.\n\n'
        '1. Face Shape: Look at the jawline (soft vs angular), cheekbone width, and the overall length-to-width ratio of the face. Classify strictly as one of: [round, square, oval, heart, diamond].\n'
        '2. Hairline: Analyze the forehead height and the temporal region for any recession. Classify strictly as one of: [receding, high, normal].\n'
        '3. Hair Texture: Look at the visible hair strand patterns. Classify strictly as one of: [straight, wavy, curly].\n\n'
        'Respond using ONLY a valid JSON object with the exact keys: "faceShape", "hairline", "hairTexture", and no extra text or markdown.'
    )

    # image_data typically comes as data:image/jpeg;base64,... 
    # the vision api in gpt-4o takes this directly
    try:
        response = openai.ChatCompletion.create(
            model='gpt-4o',
            messages=[
                {
                    'role': 'user',
                    'content': [
                        {
                            'type': 'text',
                            'text': prompt_text
                        },
                        {
                            'type': 'image_url',
                            'image_url': {
                                'url': image_data,
                                'detail': 'high'
                            }
                        }
                    ]
                }
            ],
            temperature=0.2,
            max_tokens=200
        )
        raw_text = response.choices[0].message['content']
    except Exception as e:
        print("OpenAI Vision API Error:", e)
        raise ValueError(f"Detection failed: {str(e)}")

    result = parse_json_response(raw_text)
    if not result or 'faceShape' not in result:
        raise ValueError('OpenAI detection response invalid or missing keys')
    return result


def local_detection() -> dict:
    return {
        'faceShape': 'oval',
        'hairline': 'normal',
        'hairTexture': 'straight'
    }


def get_virtual_mirror_detection():
    payload = request.get_json(silent=True) or {}
    image_data = payload.get('imageData')
    if not image_data:
        return jsonify({'error': 'Missing imageData'}), 400

    try:
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            detection = call_openai_detection(image_data)
            return jsonify({'source': 'OpenAI', **detection})
    except Exception:
        pass

    return jsonify({'source': 'fallback', **local_detection()})


def get_virtual_mirror_recommendation():
    payload = request.get_json(silent=True) or {}
    expected_fields = ['faceShape', 'hairDensity', 'hairTexture', 'hairline', 'maintenance']
    missing = [field for field in expected_fields if not payload.get(field)]
    if missing:
        return jsonify({'error': 'Missing fields: ' + ', '.join(missing)}), 400

    normalized = {
        'faceShape': payload['faceShape'].lower(),
        'hairDensity': payload['hairDensity'].lower(),
        'hairTexture': payload['hairTexture'].lower(),
        'hairline': payload['hairline'].lower(),
        'maintenance': payload['maintenance'].lower()
    }

    try:
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key:
            return jsonify(call_openai_recommendation(normalized))
    except Exception:
        pass

    return jsonify(local_recommendation(normalized))
