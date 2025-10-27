import tensorflow as tf
from tensorflow import keras
import pickle
model = keras.models.load_model('hand_model_fixed.h5')
converter  = tf.lite.TFLiteConverter.from_keras_model(model)

tflite_model = converter.convert()

with open("model.tflite", "wb") as f:
    f.write(tflite_model)