import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('puntos'); // puntos, agenda
  const [searchDni, setSearchDni] = useState('');
  const [modalType, setModalType] = useState(null); // 'use', 'add', null
  const [selectedUser, setSelectedUser] = useState(null);
  const [addAmount, setAddAmount] = useState('');

  // Mock Data
  const [users, setUsers] = useState([
    { id: 1, dni: '76543210', nombre: 'Carlos Perez', puntos: 150, fecha: '12/06/2026' },
    { id: 2, dni: '12345678', nombre: 'Ana Gomez', puntos: 50, fecha: '14/06/2026' }
  ]);

  const [reservations, setReservations] = useState([
    { id: 1, nombre: 'Juan', hora_inicio: '09:00', hora_fin: '11:00', servicio: 'Mantenimiento' },
    { id: 2, nombre: 'Pedro', hora_inicio: '14:00', hora_fin: '14:30', servicio: 'Revisión' }
  ]);

  const filteredUsers = searchDni ? users.filter(u => u.dni.includes(searchDni)) : users;

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const executeAction = () => {
    if (modalType === 'use') {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, puntos: 0 } : u));
      alert(`Puntos canjeados. Descuento de S/.${(selectedUser.puntos * 0.01).toFixed(2)} aplicado.`);
    } else if (modalType === 'add') {
      const pts = parseFloat(addAmount) * 1; // 1 sol = 1 punto? En instrucciones: Ratio 1 a 0.01 (1 sol = 0.01 puntos de canje? O 1 sol = 1 punto, que equivale a 0.01 de descuento? Asumiré 1 sol = 1 punto).
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, puntos: u.puntos + pts } : u));
      alert(`+${pts} puntos añadidos a ${selectedUser.nombre}`);
    }
    setModalType(null);
    setAddAmount('');
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', paddingTop: '60px' }}>
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
            {filteredUsers.map(user => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '15px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `hsl(${Math.random() * 360}, 70%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>
                  {user.nombre.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{user.dni}</div>
                  <div style={{ fontSize: '0.9rem' }}>{user.nombre}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registro: {user.fecha}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: '15px' }}>
                  <div style={{ color: 'var(--primary-gold)', fontWeight: 'bold', fontSize: '1.2rem' }}>{user.puntos}</div>
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
          {/* Reutilizando lógica visual de agenda básica */}
          <div style={{ fontWeight: 'bold', marginBottom: '20px', color: 'var(--primary-gold)' }}>Hoy</div>
          
          <div style={{ position: 'relative', borderLeft: '2px solid var(--surface-border)', marginLeft: '20px', paddingLeft: '20px' }}>
            {reservations.map(res => (
              <div key={res.id} style={{ marginBottom: '20px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--primary-gold)', padding: '15px', borderRadius: '8px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-26px', top: '20px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-gold)' }}></div>
                <div style={{ fontWeight: 'bold' }}>{res.hora_inicio} - {res.hora_fin}</div>
                <div style={{ fontSize: '1.1rem', marginTop: '5px' }}>{res.nombre}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{res.servicio}</div>
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
                <p>¿Está seguro que quiere usar TODOS los puntos equivalentes a <strong>S/. {(selectedUser.puntos * 0.01).toFixed(2)}</strong>?</p>
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
                  <p style={{ color: 'var(--status-green)', margin: '10px 0' }}>= {addAmount} puntos</p>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-main)' }} onClick={() => setModalType(null)}>Cancelar</button>
              <button className="btn-primary" onClick={executeAction}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
