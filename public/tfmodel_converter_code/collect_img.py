# import os
# import time
# import cv2

# os.system("python -m venv ./venv")
# os.system("cd venv/bin && activate")


# DATA_DIR = './data'
# if not os.path.exists(DATA_DIR):
#     os.makedirs(DATA_DIR)

# dataset_size = 400
# alpha = ['A','B','C', 'D', 'E','F','G', 'H']
# number_of_classes = 7
# print(number_of_classes)
# cap = cv2.VideoCapture(0)
# j = 3
# for j in range(6,number_of_classes):
#     if not os.path.exists(os.path.join(DATA_DIR, str(j))):
#         os.makedirs(os.path.join(DATA_DIR, str(j)))

#     print('Collecting data for class {}'.format(alpha[j]))

#     done = False
#     while True:
#         ret, frame = cap.read()
#         # frame = cv2.flip(frame, 1)
#         cv2.putText(frame, 'Ready? Press "Q" for {} ! :)'.format(alpha[j]), (100, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3,
#                     cv2.LINE_AA)
#         cv2.imshow('frame', frame)
#         if cv2.waitKey(25) == ord('q'):
#             break
    
#     counter = 0
#     while counter < 200:
#         ret, frame = cap.read()
#         # frame = cv2.flip(frame, 1)
#         cv2.imshow('frame', frame)
#         cv2.waitKey(25)
#         cv2.imwrite(os.path.join(DATA_DIR, str(j), '{}.jpg'.format(counter)), frame)
#         counter += 1

#     while True:
#         ret, frame = cap.read()
#         # frame = cv2.flip(frame, 1)
#         cv2.putText(frame, 'Press "Q" for {} left hand ! :)'.format(alpha[j]), (100, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3,
#                     cv2.LINE_AA)
#         cv2.imshow('frame', frame)
#         if cv2.waitKey(25) == ord('q'):
#             break

#     while counter < dataset_size:
#         ret, frame = cap.read()
#         # frame = cv2.flip(frame, 1)
#         cv2.imshow('frame', frame)
#         cv2.waitKey(25)
#         cv2.imwrite(os.path.join(DATA_DIR, str(j), '{}.jpg'.format(counter)), frame)
#         counter += 1
# cap.release()
# cv2.destroyAllWindows()












import os
import cv2
import mediapipe as mp

DATA_DIR = './temp'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

dataset_size = 400
dataset_Left = 400
dataset_Right = 400
#         0   1   2    3    4   5   6      7   8    9  10   11  12    13  14  15 16  17  18  19  20  21  22  23  24  25
alpha = ['A','B','C', 'D', 'E','F','G',   'H','I', 'J','K','L','M'  ,'N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
number_of_classes = 1
print(number_of_classes)

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

for j in range(0, 5):
    class_dir = os.path.join(DATA_DIR, str(j))
    if not os.path.exists(class_dir):
        os.makedirs(class_dir)

    print(f'Collecting data for class {alpha[j]}')

    # Wait for user to get ready
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        cv2.putText(frame, f'Ready? Press "Q" for {alpha[j]}!', (100, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3, cv2.LINE_AA)
        cv2.imshow('frame', frame)
        if cv2.waitKey(25) & 0xFF == ord('q'):
            break

    counter = 0
    with mp_hands.Hands(static_image_mode=False,
                        max_num_hands=1,
                        min_detection_confidence=0.7) as hands:

        while counter < dataset_size:
            ret, frame = cap.read()
            if not ret:
                continue

            # Flip frame for mirror effect (optional)
            # frame = cv2.flip(frame, 1)

            # Convert BGR to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            # Draw landmarks if hand detected
            if results.multi_hand_landmarks:
                # for hand_landmarks in results.multi_hand_landmarks:
                    # mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # Save frame only if hand detected
                filename = os.path.join(class_dir, f'{counter}.jpg')
                cv2.imwrite(filename, frame)
                counter += 1
                cv2.putText(frame, f'Captured {counter}/{dataset_size}', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            else:
                cv2.putText(frame, 'No hand detected - not saving', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('frame', frame)
            if cv2.waitKey(25) & 0xFF == ord('q'):
                print("Interrupted by user")
                break
    
    # Wait for user to get ready
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        cv2.putText(frame, f'Press "Q" for {alpha[j]} left hand!', (100, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3, cv2.LINE_AA)
        cv2.imshow('frame', frame)
        if cv2.waitKey(25) & 0xFF == ord('q'):
            break


    with mp_hands.Hands(static_image_mode=False,
                        max_num_hands=1,
                        min_detection_confidence=0.7) as hands:

        while counter < dataset_size*2:
            ret, frame = cap.read()
            if not ret:
                continue

            # Flip frame for mirror effect (optional)
            # frame = cv2.flip(frame, 1)

            # Convert BGR to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            # Draw landmarks if hand detected
            if results.multi_hand_landmarks:
                # for hand_landmarks in results.multi_hand_landmarks:
                    # mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # Save frame only if hand detected
                filename = os.path.join(class_dir, f'{counter}.jpg')
                cv2.imwrite(filename, frame)
                counter += 1
                cv2.putText(frame, f'Captured {counter}/{dataset_size*2}', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            else:
                cv2.putText(frame, 'No hand detected - not saving', (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            cv2.imshow('frame', frame)
            if cv2.waitKey(25) & 0xFF == ord('q'):
                print("Interrupted by user")
                break

    if counter < dataset_size:
        print(f"Collected {counter} images for class {alpha[j]}")

cap.release()
cv2.destroyAllWindows()
