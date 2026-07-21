import React, { useState, useEffect } from 'react';
import { fetchDB } from '../services/api';
import ClinicalInsights from '../components/ClinicalInsights';
import useIsMobile from '../hooks/useIsMobile';

const Dashboard = ({ onSelectPatient, onNavigate }) => {
  const [data, setData] = useState({ patients: [], sessions: [], appointments: [] });
  const [loading, setLoading] = useState(true);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedQuickPatient, setSelectedQuickPatient] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const db = await fetchDB();
      setData(db);
      setLoading(false);
    };
    loadData();
  }, []);

  const now = new Date();

  // Upcoming appointments (not 'Realizado' and >= today)
  const upcomingAppts = (data.appointments || [])
    .filter(a => a.status !== 'Realizado' && new Date(`${a.date}T${a.time}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
    .slice(0, 4);

  const recentSessions = [...data.sessions].reverse().slice(0, 3);

  const handleQuickStart = () => {
    if (data.patients.length === 0) {
      alert('Cadastre ao menos um paciente antes de iniciar uma sessão de encaixe.');
      return;
    }
    setSelectedQuickPatient(data.patients[0].id);
    setShowQuickModal(true);
  };

  const handleQuickConfirm = () => {
    if (selectedQuickPatient) {
      setShowQuickModal(false);
      onSelectPatient(selectedQuickPatient);
    }
  };

  const isMobile = useIsMobile();

  if (loading) return <div className="dashboard"><p>Carregando dados...</p></div>;

  const renderDashboardContent = () => {
    if (isMobile) {
      return (
        <div className="mobile-dashboard">
          <section className="mobile-section">
             <div className="quick-start-card">
              <h4>Nova Sessão Rápida</h4>
              <button className="btn-quick-start" onClick={handleQuickStart}>
                <span className="material-symbols-outlined">bolt</span>
                Selecionar Paciente
              </button>
            </div>
          </section>

          <section className="mobile-section">
            <div className="appointments-card">
              <div className="section-header">
                <h3>Próximos Agendamentos</h3>
              </div>
              <div className="appointments-list">
                {upcomingAppts.length === 0 ? (
                  <p className="empty-msg">Nenhum agendado.</p>
                ) : upcomingAppts.map((appt, i) => {
                    const patient = data.patients.find(p => p.id === appt.patientId) || { name: 'Desconhecido', species: '' };
                    return (
                    <div key={i} className="appointment-item" onClick={() => onSelectPatient(patient.id)}>
                      <div className="apt-time">
                        <span className="apt-value">{appt.time}</span>
                      </div>
                      <div className="apt-patient">
                        <p className="apt-name">{patient.name}</p>
                        <p className="apt-session">{appt.reason}</p>
                      </div>
                    </div>
                  )})}
              </div>
            </div>
          </section>

          <section className="mobile-section">
            <ClinicalInsights />
          </section>

          <section className="mobile-section">
             <div className="appointments-card">
              <div className="section-header">
                <h3>Sessões Recentes</h3>
              </div>
              <div className="appointments-list">
                {recentSessions.map((session, i) => {
                  const patient = data.patients.find(p => p.id === session.patientId) || { name: 'Desconhecido' };
                  return (
                    <div key={i} className="appointment-item" onClick={() => onSelectPatient(patient.id)}>
                      <div className="apt-details" style={{padding: '4px 0'}}>
                        <p className="apt-name">{patient.name}</p>
                        <p className="apt-session">{session.type} · {new Date(session.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <section className="main-grid dashboard-grid">
        {/* LEFT COLUMN: Operations (Appointments & History) */}
        <div className="operations-column">
          
          <div className="appointments-card">
            <div className="section-header">
              <h3>Próximos Atendimentos <span className="subtitle">(Agenda)</span></h3>
              <button className="link-btn" onClick={() => onNavigate && onNavigate('agenda')}>Ver Agenda Completa</button>
            </div>
            
            <div className="appointments-list">
              {upcomingAppts.length === 0 ? (
                <p style={{padding: '16px', color: 'var(--on-surface-variant)', fontSize: '0.9rem'}}>Nenhum paciente agendado no momento.</p>
              ) : upcomingAppts.map((appt, i) => {
                  const patient = data.patients.find(p => p.id === appt.patientId) || { name: 'Desconhecido', species: '' };
                  return (
                  <div key={i} className="appointment-item" onClick={() => onSelectPatient(patient.id)} style={{cursor: 'pointer'}}>
                    <div className="apt-time">
                      <span className="apt-label">{new Date(`${appt.date}T00:00:00`).toLocaleDateString('pt-BR', {weekday: 'short'}).toUpperCase()}</span>
                      <span className="apt-value" style={{fontSize: '1.25rem'}}>{appt.time}</span>
                    </div>
                    <div className="divider" style={{margin: '0 16px', height: '36px'}}></div>
                    <div className="apt-patient">
                      <div className="patient-avatar" style={{width: 36, height: 36}}>
                        <span className="material-symbols-outlined pet-icon" style={{fontSize: 18}}>pets</span>
                      </div>
                      <div className="apt-details">
                        <p className="apt-name" style={{fontSize: '0.95rem'}}>{patient.name} <span className="apt-breed">· {patient.species}</span></p>
                        <p className="apt-session" style={{fontSize: '0.75rem', color: 'var(--primary)'}}>{appt.reason || 'Sessão de Fisioterapia'}</p>
                      </div>
                    </div>
                  </div>
                )})}
            </div>
          </div>

          <div className="appointments-card" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="section-header">
              <h3>Sessões Recentes <span className="subtitle">(Histórico)</span></h3>
              <button className="link-btn" onClick={() => onNavigate && onNavigate('patients')}>Ver Pacientes</button>
            </div>
            <div className="appointments-list">
              {recentSessions.length === 0 ? (
                <p style={{padding: '16px', color: 'var(--on-surface-variant)', fontSize: '0.9rem'}}>Nenhuma sessão registrada ainda.</p>
              ) : recentSessions.map((session, i) => {
                  const patient = data.patients.find(p => p.id === session.patientId) || { name: 'Desconhecido', species: '' };
                  return (
                  <div key={i} className="appointment-item" onClick={() => onSelectPatient(patient.id)} style={{cursor: 'pointer', backgroundColor: 'var(--surface-container-low)'}}>
                    <div className="apt-time">
                      <span className="apt-label">Data</span>
                      <span className="apt-value" style={{fontSize: '1rem'}}>{new Date(session.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="divider" style={{margin: '0 16px', height: '36px'}}></div>
                    <div className="apt-patient">
                      <div className="apt-details">
                        <p className="apt-name" style={{fontSize: '0.95rem'}}>{patient.name}</p>
                        <p className="apt-session" style={{fontSize: '0.75rem'}}>{session.type || 'Fisioterapia'}</p>
                      </div>
                    </div>
                  </div>
                )})}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Fast Start & Insights */}
        <div className="quick-actions">
          
          <div className="quick-start-card" style={{ flexShrink: 0 }}>
            <h4>Nova Sessão Rápida</h4>
            <p style={{ marginBottom: '16px' }}>Inicie a ficha de tratamento para um encaixe de emergência.</p>
            <button className="btn-quick-start" onClick={handleQuickStart}>
              <span className="material-symbols-outlined">bolt</span>
              Selecionar Paciente
            </button>
          </div>

          <div className="insights-panel">
            {/* The Clinical Insights component takes the rest of the height */}
            <ClinicalInsights />
          </div>

        </div>
      </section>
    );
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <h2>Bom dia, Dra. Brenda</h2>
        <p>Você tem {upcomingAppts.length} atendimentos futuros agendados.</p>
      </header>

      {renderDashboardContent()}

      {/* Quick Start Modal */}
      {showQuickModal && (
        <div className="modal-overlay" onClick={() => setShowQuickModal(false)} style={{ zIndex: 300 }}>
          <div className="modal-content mobile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Início Rápido</h3>
              <button className="icon-btn" onClick={() => setShowQuickModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p style={{color: 'var(--on-surface-variant)', marginBottom: '16px'}}>Selecione o paciente para registrar a sessão de hoje:</p>
            <div className="form-group">
              <label>Paciente</label>
              <select
                className="form-select"
                value={selectedQuickPatient}
                onChange={e => setSelectedQuickPatient(e.target.value)}
              >
                {data.patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.tutor}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions mobile-actions-stack">
              <button className="btn-secondary" onClick={() => setShowQuickModal(false)}>Cancelar</button>
              <button className="btn-primary" style={{border:'none',cursor:'pointer'}} onClick={handleQuickConfirm}>
                <span className="material-symbols-outlined">bolt</span>
                Abrir Prontuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
