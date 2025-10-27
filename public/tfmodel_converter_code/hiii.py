import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import pickle
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.utils import shuffle

# Load and preprocess the data from data.pickle
with open("./data.pickle", "rb") as f:
    data_dict = pickle.load(f)

# print(data_dict["labels"])
# Convert to numpy arrays
X = np.array(data_dict["data"])
y = np.array(data_dict["labels"])

# print data and labels where lable is 'SPACE'
for i in range(len(y)):
    if y[i] == 'SPACE':
        print(f"Data: {X[i]}, Label: {y[i]}")
        break
for i in range(len(y)):
    if y[i] == 'T':
        print(f"Data: {X[i]}, Label: {y[i]}")
        exit()

# Filter out entries that do not have 42 features (21 landmarks x 2 coordinates)
X = np.array([x for x in X if len(x) == 42])
y = y[:len(X)]  # match label length after filtering

# Encode labels to integers
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)
y_encoded = keras.utils.to_categorical(y_encoded)


# X, y_encoded = shuffle(X, y_encoded, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.4, random_state=42)

# Build the model (Keras Sequential, TensorFlow.js compatible)
model = keras.Sequential([
    keras.Input(shape=(42, ), name="input"),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(64, activation='relu'),
    layers.Dense(y_encoded.shape[1], activation='softmax')  # number of classes
])

# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import Dense, Dropout

# model = Sequential([
#     Dense(128, activation='relu', input_shape=(42,)),  # 21 keypoints * 3 (x, y, z)
#     Dropout(0.3),
#     Dense(64, activation='relu'),
#     Dense(7, activation='softmax')  # num_classes = number of gestures
# ])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
# model.compile(
#     optimizer=keras.optimizers.RMSprop(),  # Optimizer
#     # Loss function to minimize
#     loss=keras.losses.SparseCategoricalCrossentropy(),
#     # List of metrics to monitor
#     metrics=[keras.metrics.SparseCategoricalAccuracy()],
# )


# Train the model
# model.fit(X_train, y_train, epochs=246, validation_split=0.2, batch_size=32)

callback = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
model.fit(X_train, y_train, epochs=246, validation_split=0.2, batch_size=32, callbacks=[callback])


# Save to H5 format
h5_path = "./hand_model_fixed.h5"
model.save(h5_path)

h5_path

# converting model to tensorflow model for offline use

import tensorflowjs as tfjs
from tensorflow import keras

model = keras.models.load_model('hand_model_fixed.h5')
tfjs.converters.save_keras_model(model, '../tfjs_model')
print(" Model converted successfully to 'tfjs_model/' folder.")

