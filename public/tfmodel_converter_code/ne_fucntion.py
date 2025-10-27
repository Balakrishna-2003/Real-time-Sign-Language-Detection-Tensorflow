import os

import pickle  #to save data or dataset 

import mediapipe as mp
import cv2
import matplotlib.pyplot as plt

try:
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles

    hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.7)
except Exception as e:
    print("exception : ",e)


try:
    
    LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'SPACE','DELETE']
    DATA_DIR = './temp'

    data = []
    labels = []
    os.system("clear")
    for dir_ in os.listdir(DATA_DIR):
        os.system("echo 'processing '"+dir_+"'...'")
        count = 0
        acount = 0
        for img_path in os.listdir(os.path.join(DATA_DIR, dir_)):
            data_aux = []
            img = cv2.imread(os.path.join(DATA_DIR, dir_, img_path))
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            results = hands.process(img_rgb)


            if not results.multi_hand_landmarks:
                # print(f"Deleted image: {DATA_DIR}/{dir_}/{img_path}")
                count += 1
                # Delete the image with no hands detected
                os.remove(DATA_DIR+"/"+dir_+"/"+img_path)
                continue

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    for i in range(len(hand_landmarks.landmark)):
                        x = hand_landmarks.landmark[i].x
                        y = hand_landmarks.landmark[i].y
                        # z = hand_landmarks.landmark[i].z
                        data_aux.append(x)
                        data_aux.append(y)
                        # data_aux.append(z)

                if len(data_aux) == 42:
                    # print(len(data_aux)) 
                    data.append(data_aux)
                    labels.append(dir_)
                    acount += 1
        print("loss count {}".format(count))
        print("gain count {}".format(acount))

    f = open('data.pickle', 'wb')
    pickle.dump({'data':data, 'labels':labels}, f)
    f.close()
    os.system("./tfjs-env/bin/python -u hiii.py")
    os.system("npm run dev")
except Exception as e:
    print("Exception : ",e)
