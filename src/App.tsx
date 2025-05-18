import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Pyqs from './components/pyqs';
import Quiz from './components/Quiz';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pyqs />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </Router>
  );
};

export default App;