
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


# code below for confusion matrix
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

# Evaluate model
y_pred_probs = model.predict(X_test)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = np.argmax(y_test, axis=1)

# Generate confusion matrix
cm = confusion_matrix(y_true, y_pred)
class_names = encoder.classes_

# Plot confusion matrix
plt.figure(figsize=(15, 12))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix for Hand Sign Model')
plt.show()

# Print classification report
print("\nClassification Report:")
print(classification_report(y_true, y_pred, target_names=class_names))

import numpy as np

accuracy = np.trace(cm) / np.sum(cm)
print(f"Model Accuracy: {accuracy * 100:.2f}%")


plt.savefig("confusion_matrix.png", dpi=300)



# Save to H5 format
h5_path = "./hand_model_fixed.h5"
model.save(h5_path)


# converting model to tensorflow model for offline use

# import tensorflowjs as tfjs
# from tensorflow import keras

# model = keras.models.load_model('hand_model_fixed.h5')
# tfjs.converters.save_keras_model(model, '../tfjs_model')
print(" Model converted successfully to 'tfjs_model/' folder.")

