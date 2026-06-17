import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReservationProvider } from './context/ReservationContext';
import { ModalProvider } from './context/ModalContext';
import { AuthProvider } from './context/AuthContext';

import Background from './components/Background';
import BackButton from './components/BackButton';
import GlobalModal from './components/GlobalModal';
import NavBar from './components/NavBar';

// Pages Placeholder
import Home from './pages/Home';
import MisReservas from './pages/MisReservas';
import Servicio from './pages/Servicio';
import ServicioDetalle from './pages/ServicioDetalle';
import Dia from './pages/Dia';
import Hora from './pages/Hora';
import Exito from './pages/Exito';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <ModalProvider>
      <AuthProvider>
        <ReservationProvider>
          <Router>
            <Background />
            <BackButton />
            <NavBar />
            <GlobalModal />
            <div className="app-container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/servicio" element={<Servicio />} />
                <Route path="/servicio/detalle" element={<ServicioDetalle />} />
                <Route path="/dia" element={<Dia />} />
                <Route path="/hora" element={<Hora />} />
                <Route path="/exito" element={<Exito />} />
                <Route path="/login" element={<Login />} />
                <Route path="/mis-reservas" element={<MisReservas />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </div>
          </Router>
        </ReservationProvider>
      </AuthProvider>
    </ModalProvider>
  );
}

export default App;
