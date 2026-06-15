import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('puntos'); // puntos, agenda
  const [searchDni, setSearchDni] = useState('');
  const [modalType, setModalType] = useState(null); // 'use', 'add', 'editRes', null
  const [selectedUser, setSelectedUser] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  
  // Real Data
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  
  // Agenda Date Filter (Weekly selector logic)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [days, setDays] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [agendaDate, setAgendaDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Counts & Blocked Days for Agenda
  const [reservationCounts, setReservationCounts] = useState({});
  const [blockedDays, setBlockedDays] = useState([]);

  // For Edit Reservation
  const [selectedRes, setSelectedRes] = useState(null);
  const [editResForm, setEditResForm] = useState({ hora_inicio: '', hora_fin: '', duracion_minutos: '' });

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Status for Week Selector
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

  // Fetch Reservations for selected date
  const fetchReservations = async (date) => {
    try {
      const res = await fetch(`/api/reservations?fecha=${date}`);
      const data = await res.json();
      if (res.ok) setReservations(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'puntos') {
      fetchUsers();
    } else if (activeTab === 'agenda') {
      fetchStatus();
      fetchReservations(agendaDate);
    }
  }, [activeTab, agendaDate]);

  // Generar días de la semana
  useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
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

  const filteredUsers = searchDni ? users.filter(u => u.dni.includes(searchDni)) : users;

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const executePointAction = async () => {
    let actionType = modalType;
    let amount = 0;

    if (modalType === 'use') {
      amount = selectedUser.puntos; // use all points
    } else if (modalType === 'add') {
      amount = parseFloat(addAmount) * 0.01; 
      if (isNaN(amount) || amount <= 0) {
        alert("Ingrese un monto válido");
        return;
      }
    }

    try {
      const res = await fetch(`/api/users/${selectedUser._id}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, amount })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
        
        if (actionType === 'use') {
          alert(`Puntos canjeados. Descuento de S/.${(amount).toFixed(2)} aplicado.`);
        } else {
          alert(`+${amount.toFixed(2)} puntos añadidos a ${selectedUser.nombre}`);
        }
      } else alert("Error al actualizar puntos.");
    } catch (e) {
      console.error(e);
      alert("Error de red.");
    }

    setModalType(null);
    setAddAmount('');
  };

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
    } catch(e) { console.error(e); }
  };

  const deleteReservation = async (id) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta reserva?")) return;
    try {
      await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      fetchReservations(agendaDate);
      fetchStatus();
    } catch(e) { console.error(e); }
  };

  const handleEditRes = (res) => {
    setSelectedRes(res);
    setEditResForm({ hora_inicio: res.hora_inicio, hora_fin: res.hora_fin, duracion_minutos: res.duracion_minutos });
    setModalType('editRes');
  };

  const saveEditRes = async () => {
    try {
      await fetch(`/api/reservations/${selectedRes._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: selectedRes.fecha, ...editResForm })
      });
      setModalType(null);
      fetchReservations(agendaDate);
    } catch(e) { console.error(e); }
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', paddingTop: '60px', paddingBottom: '40px' }}>
      {/* Topbar */}
      <div className="admin-topbar">
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '5px'}}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Salir
        </button>
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'puntos' ? 'active' : ''}`} onClick={() => setActiveTab('puntos')}>Puntos</button>
          <button className={`admin-tab ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>Agenda</button>
        </div>
      </div>

      {activeTab === 'puntos' && (
        <div className="animate-fade-in" style={{ padding: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar DNI..." 
              style={{ width: '100%', maxWidth: '100%' }}
              value={searchDni}
              onChange={(e) => setSearchDni(e.target.value)}
            />
            <svg style={{ position: 'absolute', right: '15px', top: '15px', color: 'var(--text-muted)' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredUsers.length === 0 && <div className="text-center" style={{color: 'var(--text-muted)'}}>No hay usuarios registrados.</div>}
            {filteredUsers.map(user => (
              <div key={user._id} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '15px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `hsl(${Math.random() * 360}, 70%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>
                  {user.nombre.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{user.dni}</div>
                  <div style={{ fontSize: '0.9rem' }}>{user.nombre}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registro: {new Date(user.fechaRegistro).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: '15px' }}>
                  <div style={{ color: 'var(--primary-gold)', fontWeight: 'bold', fontSize: '1.2rem' }}>{Number(user.puntos).toFixed(2)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>pts</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAction(user, 'use')} style={{ background: 'var(--status-green)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>USAR</button>
                  <button onClick={() => handleAction(user, 'add')} style={{ background: 'var(--primary-gold)', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>+</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'agenda' && (
        <div className="animate-fade-in" style={{ padding: '20px' }}>
          
          {/* Day Selector */}
          <div className="week-container" style={{ margin: '0 auto 20px', maxWidth: '100%' }}>
            <div className="week-header">
              <button 
                onClick={() => { if(currentWeekOffset > 0) setCurrentWeekOffset(p => p - 1) }} 
                disabled={currentWeekOffset === 0}
                style={{ background: 'transparent', border: 'none', color: currentWeekOffset === 0 ? 'var(--surface-border)' : 'var(--primary-gold)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &#9664;
              </button>
              <div style={{ fontWeight: '600' }}>{currentWeekOffset === 0 ? `Esta semana ${monthName}` : `Semana +${currentWeekOffset} ${monthName}`}</div>
              <button 
                onClick={() => { if(currentWeekOffset < 3) setCurrentWeekOffset(p => p + 1) }} 
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
                    className={`day-circle ${day.statusClass} ${day.isSelected ? 'active' : ''} ${day.isPast ? 'disabled' : ''}`}
                    onClick={() => { if(!day.isPast) setAgendaDate(day.fullDateStr) }}
                  >
                    {day.dayNum}
                    {day.isToday && <span className="tag-hoy">Hoy</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Reservas del día</div>
            <button 
              className="btn-primary" 
              style={{ width: 'auto', padding: '8px 16px', fontSize: '0.9rem', background: blockedDays.includes(agendaDate) ? 'transparent' : 'var(--status-red)', border: blockedDays.includes(agendaDate) ? '1px solid var(--status-red)' : 'none', color: blockedDays.includes(agendaDate) ? 'var(--status-red)' : 'white' }}
              onClick={toggleBlockedDay}
            >
              {blockedDays.includes(agendaDate) ? 'Desmarcar Full' : 'Marcar Full'}
            </button>
          </div>
          
          <div style={{ position: 'relative', borderLeft: '2px solid var(--surface-border)', marginLeft: '20px', paddingLeft: '20px' }}>
            {reservations.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No hay reservas para este día.</div>}
            {reservations.map(res => (
              <div key={res._id} style={{ marginBottom: '20px', background: 'rgba(230, 57, 70, 0.1)', border: '1px solid var(--primary-gold)', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-26px', top: '20px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-gold)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 'bold' }}>{res.hora_inicio} - {res.hora_fin}</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleEditRes(res)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => deleteReservation(res._id)} style={{ background: 'transparent', border: 'none', color: 'var(--status-red)', cursor: 'pointer' }}>❌</button>
                  </div>
                </div>
                <div style={{ fontSize: '1.1rem', marginTop: '5px' }}>{res.nombre_temporal}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{res.servicio} ({res.duracion_minutos} min)</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-color)', padding: '30px', borderRadius: '16px', border: '1px solid var(--primary-gold)', width: '90%', maxWidth: '350px' }}>
            
            {modalType === 'use' && (
              <>
                <h3 style={{ marginBottom: '15px' }}>Confirmar Canje</h3>
                <p>¿Está seguro que quiere usar TODOS los puntos equivalentes a <strong>S/. {(selectedUser.puntos).toFixed(2)}</strong> de descuento?</p>
              </>
            )}

            {modalType === 'add' && (
              <>
                <h3 style={{ marginBottom: '15px' }}>Acumular Puntos</h3>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Valor de venta (S/.)" 
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  style={{ width: '100%' }}
                />
                {addAmount && (
                  <p style={{ color: 'var(--status-green)', margin: '10px 0' }}>= {(parseFloat(addAmount) * 0.01).toFixed(2)} puntos</p>
                )}
              </>
            )}

            {modalType === 'editRes' && (
              <>
                <h3 style={{ marginBottom: '15px' }}>Editar Reserva</h3>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hora de Inicio</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editResForm.hora_inicio}
                  onChange={(e) => setEditResForm({...editResForm, hora_inicio: e.target.value})}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hora de Fin</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editResForm.hora_fin}
                  onChange={(e) => setEditResForm({...editResForm, hora_fin: e.target.value})}
                  style={{ width: '100%', marginBottom: '10px' }}
                />
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duración (minutos)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editResForm.duracion_minutos}
                  onChange={(e) => setEditResForm({...editResForm, duracion_minutos: e.target.value})}
                  style={{ width: '100%' }}
                />
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)' }} onClick={() => setModalType(null)}>Cancelar</button>
              <button className="btn-primary" onClick={modalType === 'editRes' ? saveEditRes : executePointAction}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
