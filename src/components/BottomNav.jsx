import React, { useState } from 'react';
import { fetchDB } from '../services/api';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Início', icon: 'home' },
  { id: 'patients', label: 'Pacientes', icon: 'pets' },
  { id: 'agenda', id_route: 'calendar', label: 'Agenda', icon: 'calendar_month' },
  { id: 'sessions', label: 'Sessões', icon: 'history' },
];

const BottomNav = ({ activeTab, onTabChange, onSelectPatient }) => {
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPt, setSelectedPt] = useState('');

  const handleFAB = async () => {
    const db = await fetchDB();
    const pts = db.patients || [];
    setPatients(pts);
    setSelectedPt(pts[0]?.id || '');
    setShowQuickModal(true);
  };

  const handleConfirm = () => {
    if (selectedPt && onSelectPatient) {
      setShowQuickModal(false);
      onSelectPatient(selectedPt);
    }
  };

  return (
    <>
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => {
          const routeId = item.id_route || item.id;
          const isActive = activeTab === item.id || activeTab === routeId;
          return (
            <button
              key={item.id}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(routeId)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        })}

        {/* FAB center */}
        <button className="bottom-nav-fab" onClick={handleFAB} title="Nova Sessão">
          <span className="material-symbols-outlined">add</span>
        </button>
      </nav>

      {showQuickModal && (
        <div className="modal-overlay" onClick={() => setShowQuickModal(false)} style={{ zIndex: 400 }}>
          <div className="modal-content mobile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚡ Nova Sessão</h3>
              <button className="icon-btn" onClick={() => setShowQuickModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {patients.length === 0 ? (
              <p style={{ color: 'var(--on-surface-variant)', padding: '8px 0' }}>
                Nenhum paciente cadastrado ainda.
              </p>
            ) : (
              <>
                <div className="form-group">
                  <label>Selecione o paciente</label>
                  <select className="form-select" value={selectedPt} onChange={e => setSelectedPt(e.target.value)}>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.tutor}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions mobile-actions-stack">
                  <button className="btn-secondary" onClick={() => setShowQuickModal(false)}>Cancelar</button>
                  <button
                    className="btn-primary"
                    style={{ border: 'none', cursor: 'pointer' }}
                    onClick={handleConfirm}
                  >
                    Abrir Prontuário
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
