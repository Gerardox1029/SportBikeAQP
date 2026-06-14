import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ReservationProvider } from './context/ReservationContext';

import Background from './components/Background';
import BackButton from './components/BackButton';

// Pages Placeholder
import Home from './pages/Home';
import Servicio from './pages/Servicio';
import ServicioDetalle from './pages/ServicioDetalle';
import Dia from './pages/Dia';
import Hora from './pages/Hora';
import Exito from './pages/Exito';
import Registro from './pages/Registro';
import Admin from './pages/Admin';

function App() {
  return (
    <ReservationProvider>
      <Router>
        <Background />
        <BackButton />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/servicio" element={<Servicio />} />
            <Route path="/servicio/detalle" element={<ServicioDetalle />} />
            <Route path="/dia" element={<Dia />} />
            <Route path="/hora" element={<Hora />} />
            <Route path="/exito" element={<Exito />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </ReservationProvider>
  );
}

export default App;
