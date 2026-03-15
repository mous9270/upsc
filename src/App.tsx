import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Pyqs from './components/pyqs';
import Quiz from './components/Quiz';
import About from './components/About';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pyqs />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
};

export default App;