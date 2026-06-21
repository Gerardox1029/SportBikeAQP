import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';

const AdminAgenda = () => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [days, setDays] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().split('T')[0]);

  const [reservationCounts, setReservationCounts] = useState({});
  const [blockedDays, setBlockedDays] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showConfirm, showAlert } = useModal();

  const fetchStatus = async () => {
    try {
      const today = new Date();
      const startStr = today.toISOString().split('T')[0];
      const end = new Date();
      end.setDate(end.getDate() + 30);
      const endStr = end.toISOString().split('T')[0];

      const countRes = await fetch(`/api/reservations/counts?startDate=${startStr}&endDate=${endStr}`);
      if (countRes.ok) setReservationCounts(await countRes.json());

      const blockRes = await fetch(`/api/blocked-days?startDate=${startStr}&endDate=${endStr}`);
      if (blockRes.ok) setBlockedDays((await blockRes.json()).map(b => b.fecha));
    } catch (e) { console.error(e); }
  };

  const fetchReservations = async (date) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reservations?fecha=${date}`);
      if (res.ok) setReservations(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchReservations(agendaDate);
  }, [agendaDate]);

  // Generar días de la semana
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      if (i === 0 || i === 6) currentMonth = monthNames[date.getMonth()];

      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();
      const fullDateStr = date.toISOString().split('T')[0];

      const isBlocked = blockedDays.includes(fullDateStr);
      const resCount = reservationCounts[fullDateStr] || 0;

      let statusClass = 'gray'; // past
      if (!isPast) {
        if (isBlocked || resCount >= 4) statusClass = 'red';
        else if (resCount >= 2) statusClass = 'yellow';
        else statusClass = 'green';
      }

      weekDays.push({
        date: date, dayNum: date.getDate(), label: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
        isPast, isToday, statusClass, fullDateStr,
        isSelected: fullDateStr === agendaDate
      });
    }
    setDays(weekDays);
    setMonthName(currentMonth);
  }, [currentWeekOffset, reservationCounts, blockedDays, agendaDate]);

  const toggleBlockedDay = async () => {
    const isBlocked = blockedDays.includes(agendaDate);
    try {
      if (isBlocked) {
        await fetch(`/api/blocked-days/${agendaDate}`, { method: 'DELETE' });
      } else {
        await fetch('/api/blocked-days', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fecha: agendaDate })
        });
      }
      fetchStatus();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm("Eliminar", "¿Seguro que deseas eliminar esta reserva?");
    if (!confirmed) return;
    try {
      await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      fetchReservations(agendaDate);
      fetchStatus();
    } catch (e) { console.error(e); }
  };

  const handleEdit = async (res) => {
    await showAlert("Detalle de Reserva", `Cliente: ${res.nombre_temporal}\nServicio: ${res.servicio}\nHorario: ${res.hora_inicio} - ${res.hora_fin}\nDuración: ${res.duracion_minutos} min`);
  };

  // Generar Time Grid: de 08:00 a 17:00 (intervalos de 30 min)
  const timeSlots = [];
  for (let h = 8; h < 18; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h !== 17) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // Find reservations that overlap with a slot
  const getReservationsForSlot = (slot) => {
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    };

    const slotMins = parseInt(slot.split(':')[0], 10) * 60 + parseInt(slot.split(':')[1], 10);

    return reservations.filter(res => {
      const resStartMins = parseTime(res.hora_inicio);
      const resEndMins = resStartMins + res.duracion_minutos;

      // Check if slot is exactly the start time or falls within
      return slotMins >= resStartMins && slotMins < resEndMins;
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Agenda y Calendario</h2>
          <p className="admin-page-subtitle">Gestiona las reservas por día y bloquea fechas saturadas.</p>
        </div>
      </div>

      <div className="agenda-layout">
        <div className="time-grid">
          <div className="time-grid-header">
            <div className="time-grid-title">Grid de Horarios (8am - 5pm)</div>
          </div>
          <div className="time-grid-body">
            {isLoading ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 15px' }}></div>
                Cargando reservas...
              </div>
            ) : (
              timeSlots.map((slot, index) => {
                const activeRes = getReservationsForSlot(slot);
                const isLunchBreak = slot === '13:00' || slot === '13:30';

                return (
                  <div key={index} className={`time-row ${isLunchBreak ? 'lunch-break' : ''}`}>
                    <div className="time-label">{slot}</div>
                    <div className="time-slot">
                      {isLunchBreak && activeRes.length === 0 && (
                        <div className="time-slot-free" style={{ color: 'var(--text-muted)' }}>Horario de Almuerzo</div>
                      )}
                      {!isLunchBreak && activeRes.length === 0 && (
                        <div className="time-slot-free" style={{ color: 'var(--status-green)', fontWeight: 'bold', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '8px', padding: '4px 8px', width: 'fit-content', margin: 'auto' }}>Disponible</div>
                      )}
                      {activeRes.map(res => (
                        <div key={res._id} className="reservation-block" onClick={() => handleEdit(res)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="reservation-block-name">{res.nombre_temporal}</div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(res._id); }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--status-red)', cursor: 'pointer', padding: '0 4px' }}
                            >
                              ×
                            </button>
                          </div>
                          <div className="reservation-block-service">{res.servicio}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="agenda-side">
          <div className="agenda-card">
            <div className="week-header" style={{ marginBottom: '16px' }}>
              <button
                onClick={() => { if (currentWeekOffset > 0) setCurrentWeekOffset(p => p - 1) }}
                disabled={currentWeekOffset === 0}
                style={{ background: 'transparent', border: 'none', color: currentWeekOffset === 0 ? 'var(--surface-border)' : 'var(--primary-gold)', cursor: 'pointer', fontSize: '1.2rem' }}
              >&#9664;</button>
              <div style={{ fontWeight: '600' }}>{currentWeekOffset === 0 ? `Esta semana` : `Semana +${currentWeekOffset}`}</div>
              <button
                onClick={() => { if (currentWeekOffset < 3) setCurrentWeekOffset(p => p + 1) }}
                disabled={currentWeekOffset === 3}
                style={{ background: 'transparent', border: 'none', color: currentWeekOffset === 3 ? 'var(--surface-border)' : 'var(--primary-gold)', cursor: 'pointer', fontSize: '1.2rem' }}
              >&#9654;</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--primary-gold)', fontWeight: 'bold' }}>
              {monthName}
            </div>

            <div className="days-row">
              {days.map((day, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="day-label">{day.label}</div>
                  <div
                    className={`day-circle ${day.statusClass} ${day.isSelected ? 'active' : ''} ${day.isPast ? 'disabled' : ''}`}
                    onClick={() => { if (!day.isPast) setAgendaDate(day.fullDateStr) }}
                    style={{ width: '36px', height: '36px', fontSize: '0.9rem', position: 'relative' }}
                  >
                    {day.dayNum}
                    {day.isToday && <span className="tag-hoy" style={{ bottom: '-15px' }}>Hoy</span>}
                    {(reservationCounts[day.fullDateStr] || 0) > 0 && !day.isPast && (
                      <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--primary-gold)', color: '#000', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {reservationCounts[day.fullDateStr]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="agenda-card">
            <h3 className="agenda-card-title">Gestión del Día</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Fecha seleccionada: <strong>{agendaDate}</strong>
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-primary"
                style={{ padding: '10px', fontSize: '0.9rem', background: blockedDays.includes(agendaDate) ? 'transparent' : 'var(--status-red)', border: blockedDays.includes(agendaDate) ? '1px solid var(--status-red)' : 'none', color: blockedDays.includes(agendaDate) ? 'var(--status-red)' : 'white' }}
                onClick={toggleBlockedDay}
              >
                {blockedDays.includes(agendaDate) ? 'Desbloquear Día' : 'Bloquear Día Completo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAgenda;
