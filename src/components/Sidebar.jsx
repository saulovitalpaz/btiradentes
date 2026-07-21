import React, { useState } from 'react';

const Sidebar = ({ activeTab, onTabChange, onLogout, isOpen, onClose, onSelectPatient }) => {
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPt, setSelectedPt] = useState('');
  const [loadingPts, setLoadingPts] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: 'dashboard' },
    { id: 'patients', label: 'Pacientes', icon: 'pets' },
    { id: 'calendar', label: 'Agenda', icon: 'calendar_month' },
    { id: 'sessions', label: 'Sessões', icon: 'rebase_edit' },
  ];

  const handleNewSessionClick = async () => {
    setLoadingPts(true);
    try {
      const res = await fetch('/api/data');
      const db = await res.json();
      const pts = db.patients || [];
      setPatients(pts);
      setSelectedPt(pts[0]?.id || '');
    } catch {
      setPatients([]);
    }
    setLoadingPts(false);
    setShowQuickModal(true);
  };

  const handleConfirm = () => {
    if (selectedPt && onSelectPatient) {
      setShowQuickModal(false);
      onClose && onClose();
      onSelectPatient(selectedPt);
    }
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo-container">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Dra. Brenda Tiradentes" className="sidebar-logo-img" />
            <p>Fisioterapia Vet</p>
          </div>
          <button className="icon-btn close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onTabChange(item.id);
                onClose && onClose();
              }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-new-session" onClick={handleNewSessionClick}>
            <span className="material-symbols-outlined">add_circle</span>
            <span>Nova Sessão</span>
          </button>

          <div className="sidebar-actions">
            <a href="#logout" className="action-item" onClick={(e) => { e.preventDefault(); onLogout && onLogout(); }}>
              <span className="material-symbols-outlined">logout</span>
              <span>Sair</span>
            </a>
          </div>

          <div className="sidebar-profile">
            <img
              src="perfil.jpg"
              alt="Dra. Brenda"
              className="profile-img"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="profile-info">
              <p className="profile-name">Dra. Brenda</p>
              <p className="profile-role">Fisiatra Veterinária</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Quick New Session Modal */}
      {showQuickModal && (
        <div className="modal-overlay" onClick={() => setShowQuickModal(false)} style={{zIndex: 300}}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚡ Nova Sessão Rápida</h3>
              <button className="icon-btn" onClick={() => setShowQuickModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {loadingPts ? (
              <p>Carregando pacientes...</p>
            ) : patients.length === 0 ? (
              <p style={{color:'var(--on-surface-variant)'}}>Nenhum paciente cadastrado ainda. Cadastre um paciente primeiro.</p>
            ) : (
              <>
                <p style={{color: 'var(--on-surface-variant)', marginBottom: '16px'}}>Selecione o paciente para abrir o prontuário:</p>
                <div className="form-group">
                  <label>Paciente</label>
                  <select className="form-select" value={selectedPt} onChange={e => setSelectedPt(e.target.value)}>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.tutor}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowQuickModal(false)}>Cancelar</button>
                  <button className="btn-primary" style={{border:'none',cursor:'pointer'}} onClick={handleConfirm}>
                    <span className="material-symbols-outlined">bolt</span>
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

export default Sidebar;
