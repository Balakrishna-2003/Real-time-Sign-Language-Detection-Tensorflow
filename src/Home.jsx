import { useRef, useState, useEffect } from 'react';
import { BrowserRouter,Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';

import Page from './components/page';

function App() {
  // const [ title, setTitle ] = useState('Live Interaction (offline)');
  // const [ showImage, setShowImage ] = useState(false);
  // const img = '/image.png';


  // const webcamRef = useRef(null);
  // const canvasRef = useRef(null);
  // const cameraRef = useRef(null);
  // const modelRef = useRef(null);

  // const [prediction, setPrediction] = useState('');

  // // supervised labels for the model to predict
  // // const LABELS = ['A', 'B', 'C', 'D', 'E', '😁', 'F', ];
  // const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

  // useEffect(() => {
  //   let isMounted = true;

  // const loadModel = async () => {
  //   try {
  //     console.log(' Loading model...');
  //     const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
  //     modelRef.current = loadedModel;
  //     console.log(' TF model loaded successfully');
      
  //     // initiale testing
  //     tf.tidy(() => {
  //       loadedModel.predict(tf.zeros([1, 42]));  // change for 63 3 cordinates
  //       // loadedModel.predict(tf.zeros([1, 63]));
  //     });

  //   } catch (error) {
  //     console.error('Model loading failed:', error);
  //   }
  // };

  //   loadModel(); //loading the tensorflow model

  //   const videoElement = webcamRef.current;
  //   const canvasElement = canvasRef.current;
  //   const ctx = canvasElement.getContext('2d');
    

  //   const hands = new Hands({
  //     locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  //   });

  //   hands.setOptions({
  //     maxNumHands: 1,
  //     modelComplexity: 1,
  //     minDetectionConfidence: 0.7,
  //     minTrackingConfidence: 0.5,
  //   });

  //   hands.onResults((results) => {
  //     ctx.save();
  //     ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  //     ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  //     if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
  //       const lm = results.multiHandLandmarks[0];

  //       // data points on the hand
  //       drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
  //       drawLandmarks(ctx, lm, { color: '#FFAA00', lineWidth: 1, radius: 3 });

        

  //       // 🔹 Prepare model input (x1, y1, x2, y2, …)
  //       const flat = lm.flatMap((p) => [p.x, p.y]); // change for 3 cordinates add p.z
  //       // console.log(flat.length);
  //       // console.log(modelRef.current);
        
        
  //       let minX = 0;
  //       let minY = 0;
  //       for (const landmarks of results.multiHandLandmarks){
  //       // calculation for the axis of the box
  //         const xValues = landmarks.map((point) => point.x * canvasElement.width);
  //         const yValues = landmarks.map((point) => point.y * canvasElement.height);
  //         minX = Math.min(...xValues)-20;
  //         const maxX = Math.max(...xValues)+20;
  //         minY = Math.min(...yValues)-20;
  //         const maxY = Math.max(...yValues)+20;

  //         // code below for boundery box 
  //         ctx.beginPath();
  //         ctx.strokeStyle = 'green';
  //         ctx.lineWidth = 2;
  //         ctx.rect(minX, minY, maxX - minX, maxY - minY);
  //         ctx.stroke();
  //       }

  //       if (flat.length === 42 && modelRef.current) { // change for 3 cordinates updated 42 -> 63
          
  //         tf.tidy(() => {
  //           const input = tf.tensor(flat).reshape([1, 42]); // change for 3 cordinates
  //           // const input = tf.tensor(flat).reshape([1, 63]);
  //           const out = modelRef.current.predict(input);
  //           console.log("out "+ out);

  //           const probabilities = out.dataSync(); 

  //           // console.log(out);
  //           const idx = out.argMax(1).dataSync()[0];

            
  //           const confidence = (probabilities[idx] * 100).toFixed(2);  // model accuracy
                      
  //           console.log(`Prediction: ${LABELS[idx]} (${confidence}%)`); 
  //           if (isMounted){ 
              
  //             // if(idx == 5 && confidence > 99.99){
                
  //             //     const canvas = canvasRef.current;
  //             //     const ctx = canvas.getContext('2d');
  //             //     cameraRef.current.stop();
  //             //     setShowImage(true);
  //             //     setTitle("!");
  //             //     // const image = new Image();
  //             //     // image.src = '/image.png'; // funny image

  //             //     // image.onload = () => {
  //             //     //   ctx.drawImage(image,  0, 0, canvas.width, canvas.height);
  //             //     // };
  //             // }else if(idx == 5 && confidence <= 99.99){
  //             //   setPrediction('');
  //             // }else{
  //               setPrediction(LABELS[idx]);
  //               ctx.font = '20px Arial';
  //               ctx.fillStyle = 'red'; 

  //               ctx.fillText(LABELS[idx], minX, minY - 10); // -10px above the box
  //             // }
  //           };
  //         });
  //       }
  //     }

      

  //     ctx.restore();
  //   });

  //   /** start camera */
  //   if (videoElement) {
  //     cameraRef.current = new Camera(videoElement, {
  //       onFrame: async () => {
  //         await hands.send({ image: videoElement });
  //       },
  //       width: 640,
  //       height: 480,
  //     });
  //     cameraRef.current.start();
  //   }

  //   /** cleanup function*/
  //   return () => {
  //     isMounted = false;
  //     cameraRef.current && cameraRef.current.stop();
  //     hands.close();
  //   };
  // }, []);

  return (
    <div className="App">
      <div className="desktop-UI">
      <div className="overlap-wrapper">
        <div className="overlap">
          <div className="overlap-group">
            <div className="text-wrapper">Major Project</div>
            <div className="div">Real-time Hand Sign Translation</div>
            <div className="frame-wrapper">
              <div className="frame">
                <div className="vector-wrapper"><img className="vector" src="img/vector-6.svg" /></div>
              </div>
            </div>
            <img className="rectangle" src="img/rectangle.png" />
          </div>
          <div className="overlap-2">
            <div className="rectangle-2"></div>
            <div className="img-wrapper"><img className="img" src="img/vector-3.svg" /></div>
            <div className="text-wrapper-2">Live Camera Feed</div>
            <div className="rectangle-3"></div>
            <div className="rectangle-4"></div>
            <div className="text-wrapper-3">Stop</div>
            <div className="rectangle-5"></div>
            <div className="text-wrapper-4">Start Live</div>
            <div className="rectangle-6">
            
            </div>
            <img className="IMAGE" src="img/IMAGE.png" />
            <div className="rectangle-7"></div>
            <div className="rectangle-8"></div>
            <div className="frame-2"><img className="vector-2" src="img/vector.svg" /></div>
            <div className="text-wrapper-5">Ready to Detect</div>
            <p className="p">Click Start Recording to begin hand sign detection</p>
          </div>
          <div className="overlap-3">
            <div className="div-wrapper">
              <div className="frame-3"><img className="vector-3" src="img/vector-2.svg" /></div>
            </div>
            <div className="text-wrapper-6">Letter Detection</div>
            <div className="overlap-4">
              <div className="text-wrapper-7">—</div>
              <div className="text-wrapper-8">Current Letter</div>
            </div>
          </div>
          <div className="overlap-5">
            <div className="overlap-6">
              <div className="frame-3"><img className="vector-4" src="img/vector-4.svg" /></div>
            </div>
            <div className="text-wrapper-9">Word Formation</div>
            <div className="overlap-7">
              <div className="text-wrapper-10">Building word...</div>
              <div className="text-wrapper-11">Predicted Word</div>
            </div>
          </div>
          <div className="overlap-8">
            <div className="overlap-9">
              <div className="frame-3"><img className="vector-5" src="img/image.svg" /></div>
            </div>
            <div className="text-wrapper-12">Live Translation</div>
            <div className="overlap-10">
              <div className="text-wrapper-13">Target Language:</div>
              <div className="text-wrapper-14">Spanish</div>
            </div>
            <div className="overlap-11">
              <div className="text-wrapper-15">Awaiting translation...</div>
              <div className="text-wrapper-16">Translation Result</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default App;
