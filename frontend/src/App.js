import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div>Početna stranica</div>} />
          <Route path="/login" element={<div>Login stranica</div>} />
          <Route path="/register" element={<div>Register stranica</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;