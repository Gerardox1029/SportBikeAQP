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

  const handleAction = async (user, type) => {
    if (type === 'use') {
      const confirmed = await showConfirm('Usar Puntos', `¿Usar todos los puntos (S/. ${user.puntos.toFixed(2)}) de ${user.nombre}?`);
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
      // Prompt replacement isn't fully direct if we need an input. We can use a custom modal or just window.prompt for this simple admin action.
      // But we have useModal. We can build a custom prompt or just use a small inline form. Since we only have alert/confirm in useModal right now, let's use standard prompt for now or build it in later. 
      // Actually, since I replaced native prompts in useModal? No, useModal only has showAlert and showConfirm.
      // I'll create an inline state for adding points.
      const amountStr = window.prompt("Ingrese el valor del servicio en SOLES (S/.):");
      if (amountStr) {
        const amount = parseFloat(amountStr) * 0.01;
        if (!isNaN(amount) && amount > 0) {
          try {
            const res = await fetch(`/api/users/${user._id}/points`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'add', amount })
            });
            if (res.ok) {
              await showAlert('Éxito', `+${amount.toFixed(2)} puntos añadidos a ${user.nombre}`);
              fetchUsers();
            }
          } catch (e) { console.error(e); }
        } else {
          await showAlert('Error', 'Monto inválido.');
        }
      }
    }
  };

  // Historial Médico/Mecánico
  const openHistory = async (user) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    try {
      // Note: Endpoint to be implemented or assuming it exists
      const res = await fetch(`/api/users/${user._id}/history`);
      if (res.ok) {
        setHistory(await res.json());
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error(e);
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
      const res = await fetch(`/api/users/${selectedUser._id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: newNote })
      });
      if (res.ok) {
        const added = await res.json();
        setHistory([added, ...history]);
        setNewNote('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (noteId) => {
    const confirmed = await showConfirm('Eliminar', '¿Seguro que desea eliminar esta nota?');
    if (confirmed) {
      try {
        await fetch(`/api/users/${selectedUser._id}/history/${noteId}`, { method: 'DELETE' });
        setHistory(history.filter(h => h._id !== noteId));
      } catch (e) { console.error(e); }
    }
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
                  placeholder="Añadir nueva nota médica/mecánica (ej. Cambio de frenos traseros, usa Shimano XT)..."
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
                      <div className="timeline-notes">{item.notas}</div>
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
    </div>
  );
};

export default AdminPuntos;
