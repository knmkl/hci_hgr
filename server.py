# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64, io
from PIL import Image
import numpy as np
import cv2
import mediapipe as mp

app = Flask(__name__)
CORS(app)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7)

def count_fingers(hand_landmarks, hand_label):
    count = 0
    tips = [8, 12, 16, 20]
    for tip in tips:
        if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip - 2].y:
            count += 1
    if hand_label == "Right":
        if hand_landmarks.landmark[4].x < hand_landmarks.landmark[3].x:
            count += 1
    else:
        if hand_landmarks.landmark[4].x > hand_landmarks.landmark[3].x:
            count += 1
    return count

@app.route('/process_image', methods=['POST'])
def process_image():
    data = request.get_json()
    image_data = data['image'].split(',')[1]
    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    frame = np.array(image)
    frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

    results = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    hand1_fingers = 0
    hand2_fingers = 0
    if results.multi_hand_landmarks:
        for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
            label = handedness.classification[0].label
            count = count_fingers(hand_landmarks, label)
            if label == "Right":
                hand1_fingers = count
            elif label == "Left":
                hand2_fingers = count

    return jsonify({
        "right_hand": hand1_fingers,
        "left_hand": hand2_fingers,
        "total": hand1_fingers + hand2_fingers
    })

if __name__ == '__main__':
    app.run(debug=True)
