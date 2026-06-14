import React, { createContext, useState } from 'react';

export const ReservationContext = createContext();

export const ReservationProvider = ({ children }) => {
  const [reservationData, setReservationData] = useState({
    nombre_temporal: '',
    servicio: '',
    duracion_minutos: 0,
    fecha: '',
    hora_inicio: '',
    hora_fin: ''
  });

  const updateData = (newData) => {
    setReservationData(prev => ({ ...prev, ...newData }));
  };

  return (
    <ReservationContext.Provider value={{ reservationData, updateData }}>
      {children}
    </ReservationContext.Provider>
  );
};
