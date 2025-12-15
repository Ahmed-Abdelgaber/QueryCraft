import './App.css';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ExplorerPage from './pages/ExplorerPage';
import ErrorBanner from './shared/components/ErrorBanner';
import { useState } from 'react';

function App() {
  const [error, setError] = useState('');

  return (
    <Router>
      <div className="app">
        {error && (
          <ErrorBanner error={error} onDismiss={() => setError('')} />
        )}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
