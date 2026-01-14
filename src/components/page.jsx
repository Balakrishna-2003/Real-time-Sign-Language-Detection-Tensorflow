import { useRef, useState, useEffect } from "react";
import { IoVideocamOutline, IoVideocamOffOutline } from "react-icons/io5";
import { GoDotFill } from "react-icons/go";
import { FaRegFileLines } from "react-icons/fa6";
import { MdGTranslate } from "react-icons/md";

import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";
import axios from "axios";

const LABELS = [
  "A","B","C","D","E","F","G","H",
  "I","J","K","L","M","N","O","P",
  "Q","R","S","SPACE","T","U","V",
  "W","X","Y","Z","DELETE"
];

export default function Page() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [currWord, setCurrWord] = useState("");
  const [predictedWord, setPredictedWord] = useState("");
  const [translatedSen, setTranslatedSen] = useState("");
  const [translationLang, setTranslationLang] = useState("en");
  const [words, setWords] = useState([]);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const lastPredictionRef = useRef("");
  const lastTimestampRef = useRef(Date.now());
  const timerRef = useRef(null);

  const img = "/image.png";
  const io = true; // if you later want to support file input vs camera

  // Load TF model once
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel("/tfjs_model/model.json");
        modelRef.current = loadedModel;

        // warm-up
        tf.tidy(() => {
          loadedModel.predict(tf.zeros([1, 42]));
        });
      } catch (error) {
        console.error("Model loading failed:", error);
      }
    };

    loadModel();
  }, []);

  // Start/stop camera
  useEffect(() => {
    if (isCameraOn) startCamera();
    return () => {
      if (!isCameraOn && cameraRef.current) {
        cameraRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);

  const handleSpeak = () => {
    if (!translatedSen) return;
    const utterance = new SpeechSynthesisUtterance(translatedSen);
    utterance.lang = "hi-IN";
    speechSynthesis.speak(utterance);
  };

  async function handleTranslate(data) {
    if (!data.trim()) return;
    try {
      const response = await axios.post("http://localhost:3000/translate", {
        text: data,
        to: translationLang,
      });
      setTranslatedSen(response.data.translatedText);
    } catch (err) {
      console.error("Translation error:", err);
    }
  }

  async function suggestions(word) {
    if (!word) return;
    try {
      const res = await axios.post("http://localhost:3000/autocomplete", {
        req: word,
      });
      setWords(res.data.hello || []);
    } catch (err) {
      console.error("Suggestion error:", err);
    }
  }

  const handleWordSelect = (word) => {
    setPredictedWord((prevSentence) => {
      const parts = prevSentence.trim().split(" ");
      parts[parts.length - 1] = word;
      return parts.join(" ");
    });
  };

  const startCamera = () => {
    let isMounted = true;
    setIsCameraOn(true);

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = canvas?.parentElement;

      if (canvas && container) {
        const aspectRatio = 4 / 3;
        const width = container.clientWidth;
        const height = width / aspectRatio;
        canvas.width = width;
        canvas.height = height;
      }
    };

    const videoElement = webcamRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext("2d");

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
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

        drawConnectors(ctx, lm, HAND_CONNECTIONS, {
          color: "#00FFAA",
          lineWidth: 2,
        });
        drawLandmarks(ctx, lm, {
          color: "#FFD54F",
          lineWidth: 0.0,
          radius: 3,
        });

        const flat = lm.flatMap((p) => [p.x, p.y]);

        let minX = 0;
        let minY = 0;

        for (const landmarks of results.multiHandLandmarks) {
          const xValues = landmarks.map(
            (point) => point.x * canvasElement.width
          );
          const yValues = landmarks.map(
            (point) => point.y * canvasElement.height
          );

          minX = Math.min(...xValues) - 20;
          const maxX = Math.max(...xValues) + 20;
          minY = Math.min(...yValues) - 20;
          const maxY = Math.max(...yValues) + 20;

          ctx.beginPath();
          ctx.strokeStyle = "#4ADE80";
          ctx.lineWidth = 2;
          ctx.rect(minX, minY, maxX - minX, maxY - minY);
          ctx.stroke();
        }

        if (flat.length === 42 && modelRef.current) {
          tf.tidy(() => {
            const input = tf.tensor(flat).reshape([1, 42]);
            const out = modelRef.current.predict(input);
            const probabilities = out.dataSync();
            const idx = out.argMax(1).dataSync()[0];
            const confidence = (probabilities[idx] * 100).toFixed(2);

            if (isMounted && confidence > 98.0) {
              const currentChar = LABELS[idx];
              setPrediction(currentChar);

              const now = Date.now();

              if (lastPredictionRef.current !== currentChar) {
                lastPredictionRef.current = currentChar;
                lastTimestampRef.current = now;

                clearTimeout(timerRef.current);

                timerRef.current = setTimeout(() => {
                  if (currentChar === "SPACE") {
                    setCurrWord((prevWord) => {
                      setPredictedWord((prevPred) => prevPred + " ");
                      return "";
                    });
                  } else if (currentChar === "DELETE") {
                    setCurrWord((prev) => prev.slice(0, -1));
                    setPredictedWord((prev) => prev.slice(0, -1));
                  } else {
                    setCurrWord((prev) => {
                      const updatedWord = prev + currentChar;
                      suggestions(updatedWord);
                      return updatedWord;
                    });
                    setPredictedWord((prev) => prev + currentChar);
                  }
                }, 1500);
              } else {
                lastTimestampRef.current = now;
              }

              ctx.font = "20px Poppins, sans-serif";
              ctx.fillStyle = "#FFD54F";
              ctx.fillText(currentChar, minX, minY - 10);
            } else if (isMounted) {
              setPrediction("");
              lastPredictionRef.current = "";
              lastTimestampRef.current = Date.now();
              if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
              }
            }
          });
        }
      } else {
        setPrediction("");
        clearTimeout(timerRef.current);
        lastPredictionRef.current = "";
        lastTimestampRef.current = Date.now();
      }

      ctx.restore();
    });

    if (videoElement) {
      cameraRef.current = io
        ? new Camera(videoElement, {
            onFrame: async () => {
              await hands.send({ image: videoElement });
            },
          })
        : null;
      if (io) cameraRef.current.start();
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  };

  const stopCamera = () => {
    setIsCameraOn(false);
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    setPrediction("");
  };

  return (
    <div className="min-h-screen bg-[#333333] text-white px-4 py-6 md:px-8 lg:px-12 flex flex-col gap-6">
      {/* NAV / HEADER */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg animate-bounce">
            <IoVideocamOutline className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-semibold tracking-wide">
              Live Sign Recognition
            </h1>
            <p className="text-xs md:text-sm text-gray-300">
              Hand pose → Letter → Word → Translation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="flex items-center gap-1">
            <GoDotFill
              className={`text-sm ${
                isCameraOn ? "text-green-400 animate-pulse" : "text-red-400"
              }`}
            />
            {isCameraOn ? "Live" : "Offline"}
          </span>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        {/* LEFT: VIDEO / CAMERA */}
        <section className="rounded-3xl bg-[#3d3d3d] border border-white/10 shadow-2xl p-4 md:p-6 flex flex-col gap-4">
          {/* Top row: title + buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-9 w-9 rounded-2xl bg-black/40">
                {isCameraOn ? (
                  <IoVideocamOutline className="text-lg" />
                ) : (
                  <IoVideocamOffOutline className="text-lg text-gray-300" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Live Camera Feed</span>
                <span className="text-xs text-gray-300">
                  Position your hand within the frame
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stopCamera}
                disabled={!isCameraOn}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold bg-red-500/90 hover:bg-red-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <GoDotFill className="text-xs" />
                Stop
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOn(true)}
                disabled={isCameraOn}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <IoVideocamOutline className="text-base" />
                Start Live
              </button>
            </div>
          </div>

          {/* Video / Canvas */}
          <div className="mt-2 rounded-2xl bg-black/40 border border-white/10 overflow-hidden relative aspect-video flex items-center justify-center">
            {isCameraOn ? (
              <>
                <video ref={webcamRef} style={{ display: "none" }} />
                <img
                  src={img}
                  style={{ display: showImage ? "block" : "none" }}
                  className="h-full w-full object-cover"
                  alt="placeholder"
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: !showImage ? "block" : "none" }}
                  className="w-full h-full"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                <IoVideocamOffOutline className="w-16 h-16 md:w-20 md:h-20 opacity-70" />
                <p className="text-sm md:text-base text-center max-w-xs">
                  Camera is off. Click{" "}
                  <span className="font-semibold text-indigo-300">
                    &quot;Start Live&quot;
                  </span>{" "}
                  to begin.
                </p>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {words.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {words.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleWordSelect(word)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs md:text-sm text-gray-100 border border-white/10 transition-all duration-200 hover:translate-y-0.5"
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT: LETTER + WORD + TRANSLATION */}
        <section className="flex flex-col gap-4">
          {/* Letter card */}
          <div className="rounded-3xl bg-[#3d3d3d] border border-white/10 p-4 md:p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-black flex items-center justify-center">
                <FaRegFileLines className="text-sm" />
              </div>
              <span className="text-sm md:text-base font-medium">
                Letter Detection
              </span>
            </div>

            <div className="mt-2 h-20 md:h-24 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center">
              <span className="text-4xl md:text-5xl font-semibold tracking-[0.3em]">
                {prediction || <span className="text-gray-500 text-base">—</span>}
              </span>
            </div>
          </div>

          {/* Word card */}
          <div className="rounded-3xl bg-[#3d3d3d] border border-white/10 p-4 md:p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-2xl bg-sky-500/80 flex items-center justify-center">
                  <FaRegFileLines className="text-sm" />
                </div>
                <span className="text-sm md:text-base font-medium">
                  Word Formation
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  className="bg-black/40 border border-white/20 rounded-xl text-xs md:text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  value={translationLang}
                  onChange={(e) => setTranslationLang(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                  <option value="te">Telugu</option>
                  <option value="ml">Malayalam</option>
                  <option value="ja">Japanese</option>
                </select>

                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 transition-all duration-200 shadow-md hover:shadow-lg"
                  onClick={() => handleTranslate(predictedWord)}
                >
                  <MdGTranslate className="text-sm" />
                  Translate
                </button>

                <button
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold bg-white/10 hover:bg-white/20 transition-all duration-200"
                  onClick={() => {
                    setPredictedWord("");
                    setCurrWord("");
                    setWords([]);
                    setTranslatedSen("");
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-2 min-h-[64px] rounded-2xl bg-black/30 border border-white/10 px-3 py-3 flex items-center text-sm md:text-base">
              <span className="truncate">
                {predictedWord ? (
                  `${predictedWord}|`
                ) : (
                  <span className="text-gray-500">Start forming a word…</span>
                )}
              </span>
            </div>
          </div>

          {/* Translation card */}
          <div className="rounded-3xl bg-[#3d3d3d] border border-white/10 p-4 md:p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-2xl bg-emerald-500/80 flex items-center justify-center">
                <MdGTranslate className="text-sm" />
              </div>
              <span className="text-sm md:text-base font-medium">
                Translated Sentence
              </span>
            </div>

            <div className="min-h-[64px] rounded-2xl bg-black/30 border border-white/10 px-3 py-3 text-sm md:text-base">
              {translatedSen ? (
                translatedSen
              ) : (
                <span className="text-gray-500">
                  Your translation will appear here…
                </span>
              )}
            </div>

            <button
              onClick={handleSpeak}
              className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs md:text-sm font-medium transition-all duration-200 hover:shadow-lg w-fit"
            >
              🔊 Speak
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
