import { useRef, useState, useEffect } from 'react';
import './App.css';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';

function App() {
  const [ title, setTitle ] = useState('Live Interaction (offline)');
  const [ showImage, setShowImage ] = useState(false);
  const img = '/image.png';

  const canstyle = useState({
    display: "none"
  });

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);

  const [prediction, setPrediction] = useState('');

  // supervised labels for the model to predict
  const LABELS = ['A', 'B', 'C', 'D', 'E', '😁'];

  useEffect(() => {
    let isMounted = true;

  const loadModel = async () => {
    try {
      console.log(' Loading model...');
      const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
      modelRef.current = loadedModel;
      console.log(' TF model loaded successfully');
      
      // initiale testing
      tf.tidy(() => {
        loadedModel.predict(tf.zeros([1, 42]));
      });

    } catch (error) {
      console.error('Model loading failed:', error);
    }
  };

    loadModel(); //loading the tensorflow model

    const videoElement = webcamRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');
    

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      ctx.save();
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];

        // data points on the hand
        drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
        drawLandmarks(ctx, lm, { color: '#FFAA00', lineWidth: 1, radius: 3 });

        

        // 🔹 Prepare model input (x1, y1, x2, y2, …)
        const flat = lm.flatMap((p) => [p.x, p.y]);
        // console.log(flat.length);
        // console.log(modelRef.current);
        
        
        let minX = 0;
        let minY = 0;
        for (const landmarks of results.multiHandLandmarks){
        // calculation for the axis of the box
          const xValues = landmarks.map((point) => point.x * canvasElement.width);
          const yValues = landmarks.map((point) => point.y * canvasElement.height);
          minX = Math.min(...xValues)-20;
          const maxX = Math.max(...xValues)+20;
          minY = Math.min(...yValues)-20;
          const maxY = Math.max(...yValues)+20;

          // code below for boundery box 
          ctx.beginPath();
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          ctx.rect(minX, minY, maxX - minX, maxY - minY);
          ctx.stroke();
        }

        if (flat.length === 42 && modelRef.current) {
          
          tf.tidy(() => {
            const input = tf.tensor(flat).reshape([1, 42]);
            const out = modelRef.current.predict(input);

            const probabilities = out.dataSync(); 

            // console.log(out);
            const idx = out.argMax(1).dataSync()[0];

            
            const confidence = (probabilities[idx] * 100).toFixed(2);  // model accuracy
                      
            // console.log(`Prediction: ${LABELS[idx]} (${confidence}%)`); 
            if (isMounted){ 
              setPrediction(LABELS[idx]);
              ctx.font = '20px Arial';
              ctx.fillStyle = 'red'; 
              ctx.fillText(LABELS[idx], minX, minY - 10); // -10px above the box
              if(idx == 5){
                
                  const canvas = canvasRef.current;
                  const ctx = canvas.getContext('2d');
                  cameraRef.current.stop();
                  setShowImage(true);
                  setTitle("!");
                  // const image = new Image();
                  // image.src = '/image.png'; // funny image

                  // image.onload = () => {
                  //   ctx.drawImage(image,  0, 0, canvas.width, canvas.height);
                  // };
              }
            };
          });
        }
      }

      

      ctx.restore();
    });

    /** start camera */
    if (videoElement) {
      cameraRef.current = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
        width: 640,
        height: 480,
      });
      cameraRef.current.start();
    }

    /** cleanup function*/
    return () => {
      isMounted = false;
      cameraRef.current && cameraRef.current.stop();
      hands.close();
    };
  }, []);

  return (
    <div className="App">
      <h1 className="text-4xl text-center bg-blue-500 text-blue-50 font-serif" >{title}</h1>

      {/* video is hidde for MediaPipe Camera */}
      <video ref={webcamRef} style={{ display: 'none' }} />
      
      <img 
        src={img} 
        width="640" 
        height="480" 
        style={{ display: showImage ? 'block' : 'none'}}
      />

      {/* canvas used for drawing connector and prediction labels */}
      <canvas 
        ref={canvasRef} 
        width="640" 
        height="480" 
        style={{ display: !showImage ? 'block' : 'none'}}
        />
      <p className="mt-4 text-xl">Prediction: <span className="font-bold text-green-600">{prediction}</span></p>
    </div>
  );
}

export default App;
