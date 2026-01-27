import { Routes, Route, Navigate } from 'react-router-dom';
import GuestPage from './pages/GuestPage';
import AdminPage from './pages/AdminPage';
import DisplayPage from './pages/DisplayPage';

function App() {
  return (
    <Routes>
      <Route path="/guest" element={<GuestPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/" element={<Navigate to="/guest" replace />} />
    </Routes>
  );
}

export default App;
