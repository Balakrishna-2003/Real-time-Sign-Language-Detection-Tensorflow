import React, { useState } from "react";

function TextToSpeech() {
  const [text, setText] = useState("");

  const handleSpeak = () => {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN"; // You can change this
    speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px" }}>
      <h2>Text to Speech</h2>
      <textarea
        rows="5"
        style={{ width: "100%" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something to speak..."
      />
      <button onClick={handleSpeak} style={{ marginTop: "10px" }}>
        🔊 Speak
      </button>
    </div>
  );
}

export default TextToSpeech;
