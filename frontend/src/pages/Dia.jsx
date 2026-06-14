import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReservationContext } from '../context/ReservationContext';

const Dia = () => {
  const { updateData } = useContext(ReservationContext);
  const navigate = useNavigate();
  
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [days, setDays] = useState([]);
  const [monthName, setMonthName] = useState('');

  // Generar días de la semana
  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Encontrar el lunes de esta semana
    const dayOfWeek = today.getDay();
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const monday = new Date(today);
    monday.setDate(diffToMonday + (currentWeekOffset * 7));
    
    const weekDays = [];
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    let currentMonth = '';

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      if (i === 0 || i === 6) {
        currentMonth = monthNames[date.getMonth()];
      }

      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      
      // Mock occupation (random for demo purposes, in real app fetch from backend)
      // 0 = green, 1 = yellow, 2 = red
      const mockStatus = isPast ? -1 : Math.floor(Math.random() * 3); 
      
      let statusClass = 'gray'; // past
      if (!isPast) {
        if (mockStatus === 0) statusClass = 'green';
        else if (mockStatus === 1) statusClass = 'yellow';
        else statusClass = 'red'; // full
      }

      weekDays.push({
        date: date,
        dayNum: date.getDate(),
        label: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
        isPast,
        isToday,
        statusClass,
        fullDateStr: date.toISOString().split('T')[0]
      });
    }

    setDays(weekDays);
    setMonthName(currentMonth);

  }, [currentWeekOffset]);

  const handleNextWeek = () => {
    if (currentWeekOffset < 3) setCurrentWeekOffset(prev => prev + 1);
  };

  const handlePrevWeek = () => {
    if (currentWeekOffset > 0) setCurrentWeekOffset(prev => prev - 1);
  };

  const handleSelectDay = (day) => {
    if (day.isPast || day.statusClass === 'red') return; // Cannot select past or full days
    updateData({ fecha: day.fullDateStr });
    navigate('/hora');
  };

  return (
    <div className="flex-col-center animate-fade-in" style={{ width: '100%' }}>
      <h2>Selecciona un día</h2>
      
      <div className="week-container">
        <div className="week-header">
          <button 
            onClick={handlePrevWeek} 
            disabled={currentWeekOffset === 0}
            style={{ background: 'transparent', border: 'none', color: currentWeekOffset === 0 ? 'var(--surface-border)' : 'var(--primary-gold)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &#9664;
          </button>
          <div style={{ fontWeight: '600' }}>{currentWeekOffset === 0 ? 'Esta semana' : `Semana +${currentWeekOffset}`} - {monthName}</div>
          <button 
            onClick={handleNextWeek} 
            disabled={currentWeekOffset === 3}
            style={{ background: 'transparent', border: 'none', color: currentWeekOffset === 3 ? 'var(--surface-border)' : 'var(--primary-gold)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &#9654;
          </button>
        </div>

        <div className="days-row">
          {days.map((day, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="day-label">{day.label}</div>
              <div 
                className={`day-circle ${day.statusClass} ${day.isPast || day.statusClass === 'red' ? 'disabled' : ''}`}
                onClick={() => handleSelectDay(day)}
              >
                {day.dayNum}
                {day.isToday && <span className="tag-hoy">Hoy</span>}
                {day.statusClass === 'red' && <span className="tag-full">FULL</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dia;
