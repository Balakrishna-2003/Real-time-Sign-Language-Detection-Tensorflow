
import { IoVideocamOutline, IoVideocamOffOutline } from "react-icons/io5";
import { GoDotFill } from "react-icons/go";
import { FaRegFileLines } from "react-icons/fa6";
import { MdGTranslate } from "react-icons/md";

import { useRef, useState, useEffect } from 'react';
import '../App.css';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';




// import Page from './components/page';
// import { translate, Translator, speak, singleTranslate, batchTranslate, languages, isSupported, getCode } from 'google-translate-api-x';

// import { translate } from '@vitalets/google-translate-api';
import axios from 'axios';




export default function () {

  const [isCameraOn, setisCameraOn] = useState(false);

  const [title, setTitle] = useState('Live Interaction (offline)');
  const [showImage, setShowImage] = useState(false);
  const [io, setIO] = useState(true);
  const img = '/image.png';
  const [isLive, setIsLive] = useState(true);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);

  const lastPredictionRef = useRef('');
  const lastTimestampRef = useRef(Date.now());
  const timerRef = useRef(null);

  const [currWord, setCurrWord] = useState('');
  const [prediction, setPrediction] = useState('');
  const [predictedWord, setPredictedWord] = useState("");

  const [translatedSen, setTranslatedSen] = useState("");
  const [translationLang, setTranslationLang] = useState('en');

  const [words, setWords] = useState([]);



  // supervised labels for the model to predict
  // const LABELS = ['A', 'B', 'C', 'D', 'E', '😁', 'F', ];
  const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'SPACE', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'DELETE']

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log(' Loading model...');
        const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
        modelRef.current = loadedModel;
        console.log(' TF model loaded successfully');

        // initiale testing
        tf.tidy(() => {
          loadedModel.predict(tf.zeros([1, 42]));  // change for 63 3 cordinates
          // loadedModel.predict(tf.zeros([1, 63]));
        });

      } catch (error) {
        console.error('Model loading failed:', error);
      }
    };

    loadModel(); //loading the tensorflow model
  }, []);

  // add this near your other effects
  useEffect(() => {
    if (isCameraOn) {
      startCamera();
    }
    // Cleanup when camera turns off
    return () => {
      if (!isCameraOn && cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isCameraOn]);



  const handleSpeak = () => {
    if (!translatedSen) return;
    // alert(translatedSen);
    const utterance = new SpeechSynthesisUtterance(translatedSen);
    utterance.lang = "hi-IN"; // You can change this
    speechSynthesis.speak(utterance);
  };


  async function handleTranslate(data) {
    // Usually, you'd call your backend API here, not Google Translate directly.
    // const response = await fetch('/api/translate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: 'Ik spreek Engels', to: 'en' }),
    // });
    // const data = await response.json();

    const response = await axios.post('http://localhost:3000/translate', {
      text: data,
      to: translationLang
    });
    setTranslatedSen(response.data.translatedText);
    // const res = await axios.post('http://localhost:3000/autocomplete', {});
    // setWords(res.data.hello);
    // // console.log(response.data.translatedText);
    // console.log(res.data.hello);

  }


  async function suggestions(word) {
    // console.log(req.body);

    const res = await axios.post('http://localhost:3000/autocomplete', { req: word });
    setWords(res.data.hello);
    console.log(res.data);
  }

  const handleWordSelect = (word) => {
    // setPredictedWord((prev) => word);
    setPredictedWord((prevSentence) => {
      const words = prevSentence.trim().split(' ');
      words[words.length - 1] = currWord; // replace last word
      return words.join(' ');
    });
  }


  const handleChange = (value) => {
    const val = value;
    setTimeout(() => {
      if (val == prediction) {
        setPredictedWord((prev) => { prev + ' ' + val + ' ' });
        setCurrWord('');
      }
    }, 1000);
  };

  const startCamera = () => {
    console.log("hello world");
    let isMounted = true;
    setisCameraOn(true);


    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;

      if (canvas && container) {
        const aspectRatio = 4 / 3; // or 640 / 480

        // Get the container width and calculate height based on aspect ratio
        const width = container.clientWidth;
        const height = width / aspectRatio;

        // Set the canvas drawing resolution
        canvas.width = width;
        canvas.height = height;
      }
    };




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
        drawLandmarks(ctx, lm, { color: '#FFAA00', lineWidth: 0.0, radius: 3 });



        // 🔹 Prepare model input (x1, y1, x2, y2, …)
        const flat = lm.flatMap((p) => [p.x, p.y]); // change for 3 cordinates add p.z
        // console.log(flat.length);
        // console.log(modelRef.current);


        let minX = 0;
        let minY = 0;
        for (const landmarks of results.multiHandLandmarks) {
          // calculation for the axis of the box
          const xValues = landmarks.map((point) => point.x * canvasElement.width);
          const yValues = landmarks.map((point) => point.y * canvasElement.height);
          minX = Math.min(...xValues) - 20;
          const maxX = Math.max(...xValues) + 20;
          minY = Math.min(...yValues) - 20;
          const maxY = Math.max(...yValues) + 20;

          // code below for boundery box 
          ctx.beginPath();
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          ctx.rect(minX, minY, maxX - minX, maxY - minY);
          ctx.stroke();
        }

        if (flat.length === 42 && modelRef.current) { // change for 3 cordinates updated 42 -> 63

          tf.tidy(() => {
            const input = tf.tensor(flat).reshape([1, 42]); // change for 3 cordinates
            // const input = tf.tensor(flat).reshape([1, 63]);
            const out = modelRef.current.predict(input);
            // console.log(out.argMax(1));

            const probabilities = out.dataSync();

            // console.log(out);
            const idx = out.argMax(1).dataSync()[0];


            const confidence = (probabilities[idx] * 100).toFixed(2);  // model accuracy

            // console.log(`Prediction: ${LABELS[idx]} (${confidence}%)`);
            if (isMounted) {

              // if(idx == 5 && confidence > 99.99){

              //     const canvas = canvasRef.current;
              //     const ctx = canvas.getContext('2d');
              //     cameraRef.current.stop();
              //     setShowImage(true);
              //     setTitle("!");
              //     // const image = new Image();
              //     // image.src = '/image.png'; // funny image

              //     // image.onload = () => {
              //     //   ctx.drawImage(image,  0, 0, canvas.width, canvas.height);
              //     // };
              // }else if(idx == 5 && confidence <= 99.99){
              //   setPrediction('');
              // }else{
              if (confidence > 98.00) {
                const currentChar = LABELS[idx];
                setPrediction(currentChar);

                const now = Date.now();

                if (lastPredictionRef.current !== currentChar) {
                  // New prediction detected, reset timer
                  lastPredictionRef.current = currentChar;
                  lastTimestampRef.current = now;

                  // if (timerRef.current) {
                  clearTimeout(timerRef.current);
                  // }

                  timerRef.current = setTimeout(() => {
                    if (currentChar === 'SPACE') {
                      // alert(currWord)

                      // setPredictedWord((prev) => {
                      //   const curWord = currWord;
                      //   prev + ' ' + curWord + ' ';
                      //   setCurrWord('');
                      // });
                      setCurrWord((prevWord) => {
                        setPredictedWord((prevPred) => prevPred + ' ');
                        return '';
                      });
                    } else {
                      setCurrWord((prev) => {
                        const updatedWord = prev + currentChar;
                        suggestions(updatedWord);  // Pass directly to suggestions
                        return updatedWord;
                      });
                      setPredictedWord((prev) => {
                        // setPrediction('');
                        return prev + currentChar;
                      });

                    }
                  }, 1500); // wait for 3 seconds of stable prediction

                } else {
                  // Prediction is the same
                  const elapsed = now - lastTimestampRef.current;

                  // Already waiting, do nothing. Timer will handle the update.
                  // Optional: Reset timestamp to ensure the prediction is stable across frames
                  lastTimestampRef.current = now;
                }

                ctx.font = '20px Arial';
                ctx.fillStyle = 'red';
                ctx.fillText(currentChar, minX, minY - 10);
              } else {
                setPrediction('');
                lastPredictionRef.current = '';
                lastTimestampRef.current = Date.now();

                if (timerRef.current) {
                  clearTimeout(timerRef.current);
                  timerRef.current = null;
                }
              }

            };
          });
        }
      } else {
        setPrediction('');
        clearTimeout(timerRef.current);
        lastPredictionRef.current = '';
        lastTimestampRef.current = Date.now();
      }



      ctx.restore();
    });

    /** start camera */
    if (videoElement) {
      cameraRef.current = io ? new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({ image: videoElement });
        },
      }) : null;
      io ? cameraRef.current.start() : null;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    /** cleanup function*/
    // return () => {
    //   isMounted = false;
    //   window.removeEventListener('resize', resizeCanvas);
    //   cameraRef.current && cameraRef.current.stop();
    //   hands.close();
    // };
    // }, []);
  }


  const stopCamera = () => {
    // setIO(false);
    setisCameraOn(false);


    if (cameraRef.current) {
      cameraRef.current.stop();
      console.log("MediaPipe camera stopped");
    }

    // const canvas = canvasRef.current;
    // const ctx = canvas?.getContext('2d');
    // if (ctx) {
    //   // ctx.clearRect(0, 0, canvas.width, canvas.height);
    //   // ctx.drawImage('image.png', 0, 0, canvas.width, canvas.height);

    //   // ✅ Clear the previous drawing
    //   ctx.clearRect(0, 0, canvas.width, canvas.height);

    //   // ✅ Fill canvas with white background
    //   ctx.fillStyle = 'white';
    //   ctx.fillRect(0, 0, canvas.width, canvas.height);
    // }

    setPrediction('');
  };




  return (

    <div className='mainDiv'>
      <div className='videoFeedDiv'>
        <div className='videoInDiv'>
          <div className="titleBtns">
            <IoVideocamOutline style={{ marginLeft: "10px", color: "black", height: "25px", width: "25px", padding: "2px" }} />
            <h2 className='inter-font-23'>Live Camera Feed</h2>

            <div className="btns">
              <div className="stopBtn" onClick={() => stopCamera()}>
                <GoDotFill style={{ color: "red", marginLeft: "10px" }} /><button type="button" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-red-600/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isCameraOn}>stop</button>
              </div>
              <div className="startLiveBtn" onClick={() => { setisCameraOn(true) }}>
                <button type="button" disabled={isCameraOn} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">Start Live</button>
              </div>
            </div>
          </div>
          <div className="camInput">
            {
              isCameraOn ? (
                <>
                  {/* video is hidden for MediaPipe Camera */}
                  < video ref={webcamRef} style={{ display: 'none' }} />

                  <img
                    src={img}
                    style={{ display: showImage ? 'block' : 'none' }}
                  />

                  {/* canvas used for drawing connector and prediction labels */}
                  <canvas
                    ref={canvasRef}
                    style={{ display: !showImage ? 'block' : 'none' }}
                  />
                </>
              ) : (
                <div className='text-center text-slate-500 flex flex-col items-center gap-2'>
                  <IoVideocamOffOutline className="w-24 h-24" />
                  <p>Camera is off. Click "Start Live" to begin.</p>
                </div>
              )
            }


          </div>
          <div className="suggestionsDiv">
            {words.map((word, index) => (
              <div key={index} onClick={() => handleWordSelect(word)}>
                {word}
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className='LetterRecognitonDiv'>
        <div className='LetterDiv'>
          <div className='LetterTitle'>
            <div className='LetterIcon'>
              <FaRegFileLines style={{ height: "15px", width: "15px", margin: "0px" }} />
            </div>
            <h2 className='inter-font-20'>Letter </h2>
          </div>
          <div className="predictedLetter">
            {prediction}
          </div>
        </div>
        <div className='WordDiv'>
          <div className='WordTitle inter-font-20'>
            <div className='LetterIcon'>
              <FaRegFileLines style={{ height: "15px", width: "15px", margin: "0px" }} />
            </div>
            <h2 className='inter-font-20'>Word Formation </h2>
            <select className="translateOpt" onChange={(e) => setTranslationLang(e.target.value)}>
              <option value='en'>English</option>
              <option value='hi'>Hindi</option>
              <option value='kn'>Kannada</option>
              <option value='te'>Telugu</option>
              <option value='ml'>Malayalam</option>
              <option value='ja'>Japanese</option>
            </select>
            <button className="translateBtn" onClick={() => { handleTranslate(predictedWord) }} >Translate</button>
            <button className="translateBtn" onClick={() => { setPredictedWord('') }} >clear</button>
          </div>
          <div className="predictedWord">
            {predictedWord}|
          </div>
        </div>

      </div>

      <div className='Translate'>
        <div className='WordDiv'>
          <div className='WordTitle inter-font-20'>
            <div className='LetterIcon'>
              <MdGTranslate style={{ height: "15px", width: "15px", margin: "0px" }} />
            </div>
            <h2 className='inter-font-20'>Translated Sentence</h2>
          </div>
          <div className="predictedWord">
            {translatedSen}
          </div>
          <button onClick={()=>{handleSpeak()}} style={{ marginTop: "10px", border: "2px solid black" }}>
            🔊 Speak
          </button>
        </div>
      </div>
    </div>
  )
}