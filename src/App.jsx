import { useRef, useState, useEffect } from 'react';
import { BrowserRouter,Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import './App.css';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';

import Page from './components/page';
import Home from './Home';
import Navbar from './components/Navbar';

function App() {
  
  return (
    <div className="App">
      <Navbar/>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to='/Page'/>} />
          <Route path='/Page' element={<Page/>}/>
          <Route path='/Home' element={<Home/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
