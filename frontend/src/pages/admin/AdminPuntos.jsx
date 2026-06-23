import React, { useState, useEffect } from 'react';
import { useModal } from '../../context/ModalContext';

const AdminPuntos = () => {
  const [users, setUsers] = useState([]);
  const [searchDni, setSearchDni] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [newNote, setNewNote] = useState('');

  const { showConfirm, showAlert } = useModal();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = searchDni ? users.filter(u => u.dni.includes(searchDni) || u.nombre.toLowerCase().includes(searchDni.toLowerCase())) : users;

  const [addingPointsUser, setAddingPointsUser] = useState(null);
  const [pointsInput, setPointsInput] = useState('');

  const handleAction = async (user, type) => {
    if (type === 'use') {
      const confirmed = await showConfirm('Usar Puntos', `¿Usar todos los puntos (S/. ${(user.puntos * 0.002).toFixed(2)}) de ${user.nombre}?`);
      if (confirmed) {
        try {
          const res = await fetch(`/api/users/${user._id}/points`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'use', amount: user.puntos })
          });
          if (res.ok) {
            await showAlert('Éxito', `Puntos canjeados. Descuento aplicado.`);
            fetchUsers();
          }
        } catch (e) { console.error(e); }
      }
    } else if (type === 'add') {
      setAddingPointsUser(user);
      setPointsInput('');
    }
  };

  const confirmAddPoints = async () => {
    if (!addingPointsUser) return;
    const amount = parseFloat(pointsInput);
    if (!isNaN(amount) && amount > 0) {
      try {
        const res = await fetch(`/api/users/${addingPointsUser._id}/points`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', amount })
        });
        if (res.ok) {
          await showAlert('Éxito', `+${amount} puntos añadidos a ${addingPointsUser.nombre}`);
          setAddingPointsUser(null);
          fetchUsers();
        }
      } catch (e) { console.error(e); }
    } else {
      await showAlert('Error', 'Monto inválido.');
    }
  };

  // Historial Médico/Mecánico
  const openHistory = async (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    if (user.historial) {
      setHistory(user.historial.slice().reverse());
    } else {
      setHistory([]);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedUser(null);
    setHistory([]);
    setNewNote('');
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/users/${selectedUser._id}/historial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: new Date().toISOString(), nota: newNote })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setHistory(updatedUser.historial.slice().reverse());
        setNewNote('');
        fetchUsers(); // Refresh user list memory
        await showAlert('Éxito', 'Guardado exitosamente');
      }
    } catch (e) {
      console.error(e);
      await showAlert('Error', 'Error al guardar');
    }
  };

  const handleDeleteNote = async (noteId) => {
    // Para simplificar, no implementaré borrar historial del lado backend por ahora,
    // el usuario no lo pidió explícitamente, pero si pidiera lo añadiríamos.
    await showAlert('Aviso', 'Función de eliminar no implementada en backend aún.');
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Clientes y Puntos</h2>
          <p className="admin-page-subtitle">Gestiona el historial mecánico y los puntos acumulados de los clientes.</p>
        </div>
      </div>

      <div className="puntos-search">
        <input
          type="text"
          className="input-field"
          placeholder="Buscar por DNI o Nombre..."
          value={searchDni}
          onChange={(e) => setSearchDni(e.target.value)}
        />
        <svg className="puntos-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center" style={{ color: 'var(--text-muted)', marginTop: '40px' }}>
          No se encontraron clientes.
        </div>
      ) : (
        <div className="puntos-grid">
          {filteredUsers.map(user => (
            <div key={user._id} className="punto-card">
              <div className="punto-avatar" style={{ background: `hsl(${user.nombre.charCodeAt(0) * 15 % 360}, 70%, 25%)`, color: `hsl(${user.nombre.charCodeAt(0) * 15 % 360}, 70%, 80%)` }}>
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="punto-info">
                <div className="punto-dni">{user.dni}</div>
                <div className="punto-name" title={user.nombre}>{user.nombre}</div>
                <div className="punto-date">Registro: {new Date(user.fechaRegistro).toLocaleDateString()}</div>
              </div>
              <div className="punto-score">
                <div className="punto-score-value">{Number(user.puntos).toFixed(2)}</div>
                <div className="punto-score-label">pts</div>
              </div>
              <div className="punto-actions">
                <button className="btn-punto history" onClick={() => openHistory(user)}>HISTORIAL</button>
                <button className="btn-punto use" onClick={() => handleAction(user, 'use')}>USAR</button>
                <button className="btn-punto add" onClick={() => handleAction(user, 'add')}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer Overlay */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={closeDrawer}></div>

      {/* Drawer Panel */}
      <div className={`drawer-panel ${isDrawerOpen ? 'active' : ''}`}>
        {selectedUser && (
          <>
            <div className="drawer-header">
              <div>
                <div className="drawer-title">Historial Mecánico</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedUser.nombre} ({selectedUser.dni})</div>
              </div>
              <button className="drawer-close" onClick={closeDrawer}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="drawer-body">
              <div style={{ marginBottom: '24px' }}>
                <textarea
                  className="input-field"
                  style={{ height: '100px', resize: 'none', background: 'rgba(255,255,255,0.02)' }}
                  placeholder="Escribe aquí... (ejemplo. Cambio de llantas, cambio de pastillas, etc.)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                ></textarea>
                <button className="btn-primary" style={{ padding: '10px 16px', fontSize: '0.9rem' }} onClick={handleAddNote}>
                  Añadir al Historial
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center" style={{ color: 'var(--text-muted)', marginTop: '40px' }}>
                  El cliente no tiene historial registrado.
                </div>
              ) : (
                <div className="timeline">
                  {history.map(item => (
                    <div key={item._id} className="timeline-item animate-fade-in">
                      <div className="timeline-dot"></div>
                      <div className="timeline-date">{new Date(item.fecha).toLocaleString()}</div>
                      <div className="timeline-notes">{item.nota}</div>
                      <button className="timeline-delete" onClick={() => handleDeleteNote(item._id)}>
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {/* Add Points Modal Overlay */}
      {addingPointsUser && (
        <>
          <div className="drawer-overlay active" onClick={() => setAddingPointsUser(null)}></div>
          <div className="custom-modal-panel active" style={{
  position: 'fixed', 
  top: '50%', 
  left: '50%', 
  transform: 'translate(-50%, -50%)',
  background: '#1a1a1a', /* Fondo negro sólido y elegante */
  border: '1px solid #333', /* Borde sutil para darle profundidad */
  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)', /* Sombra para despegarlo del fondo */
  padding: '25px 20px', 
  borderRadius: '12px', 
  zIndex: 10001,
  width: '90%', 
  maxWidth: '320px', 
  textAlign: 'center'
}}>
  
  <h3 style={{ color: 'var(--primary-gold)', margin: '0 0 10px 0', fontSize: '1.4rem' }}>
    Añadir Puntos
  </h3>
  
  <p style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '20px', lineHeight: '1.4' }}>
    Ingrese el valor de venta (S/.1 = 1 punto) para <strong style={{color: '#fff'}}>{addingPointsUser.nombre}</strong>.
  </p>
  
  <input
    type="number"
    className="input-field"
    placeholder="Ejemplo: 25"
    value={pointsInput}
    onChange={(e) => setPointsInput(e.target.value)}
    style={{ 
      textAlign: 'center', 
      fontSize: '1.2rem', 
      marginBottom: '20px',
      width: '100%',
      boxSizing: 'border-box',
      background: '#2a2a2a', /* Input ligeramente más claro que el fondo */
      color: '#fff',
      border: '1px solid #444',
      padding: '12px',
      borderRadius: '8px',
      outline: 'none'
    }}
  />
  
  <div style={{ display: 'flex', gap: '12px' }}>
    <button 
      /* Quitamos la clase genérica si queremos forzar el estilo, o la dejamos como base */
      className="btn-secondary" 
      onClick={() => setAddingPointsUser(null)} 
      style={{ 
        flex: 1, 
        background: '#222', /* Botón opaco/negro */
        color: '#ccc', 
        border: '1px solid #444',
        padding: '12px 0',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.95rem'
      }}
    >
      Cancelar
    </button>
    
    <button 
      className="btn-primary" 
      onClick={confirmAddPoints} 
      style={{ 
        flex: 1,
        padding: '12px 0', /* Mismo padding que cancelar para que sean simétricos */
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.95rem',
        border: 'none'
      }}
    >
      Confirmar
    </button>
  </div>
</div>
        </>
      )}

    </div>
  );
};

export default AdminPuntos;
