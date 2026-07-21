import React, { useState, useEffect } from 'react';
import { fetchDB, addPatient } from '../services/api';

const PatientList = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    species: 'Canino',
    breed: '',
    age: '',
    tutor: '',
    status: 'Tratamento Ativo'
  });

  useEffect(() => {
    const loadPatients = async () => {
      const db = await fetchDB();
      setPatients(db.patients || []);
      setLoading(false);
    };
    loadPatients();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'Tratamento Ativo': return 'status-active';
      case 'Recuperação Pós-Op': return 'status-recovery';
      case 'Manutenção': return 'status-maintenance';
      default: return 'status-discharged';
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.tutor.trim()) return;

    const newPatient = await addPatient(formData);
    setPatients([...patients, newPatient]);
    setIsModalOpen(false);
    setFormData({ name: '', species: 'Canino', breed: '', age: '', tutor: '', status: 'Tratamento Ativo' });
  };

  if (loading) return <div className="patient-list-view"><p>Carregando pacientes...</p></div>;

  return (
    <div className="patient-list-view">
      <header className="view-header">
        <div className="header-info">
          <h2>Diretório de Pacientes</h2>
          <p>Gerencie e acompanhe a recuperação dos seus pacientes.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add_circle</span>
          Registrar Paciente
        </button>
      </header>

      <section className="filters-section">
        <div className="filter-card search">
           <span className="material-symbols-outlined search-icon">search</span>
           <div className="filter-inputs">
             <label>Buscar Paciente</label>
             <input type="text" placeholder="Digite o nome ou tutor..." />
           </div>
        </div>
        <div className="filter-card species">
           <label>Espécie</label>
           <div className="toggle-group">
             <button className="toggle-btn active">Canino</button>
             <button className="toggle-btn">Felino</button>
           </div>
        </div>
        <div className="filter-card status">
           <label>Status</label>
           <select className="status-select">
             <option>Todos</option>
             <option>Tratamento Ativo</option>
             <option>Manutenção</option>
             <option>Alta</option>
           </select>
        </div>
      </section>

      <section className="patients-grid">
         {patients.length === 0 ? <p style={{padding: '20px', color: 'var(--on-surface-variant)'}}>Nenhum paciente cadastrado ainda.</p> : patients.map((patient, i) => (
           <div key={i} className="patient-row">
             <div className="patient-avatar">
               <span className="material-symbols-outlined pet-icon">pets</span>
             </div>
             <div className="patient-info">
                <h3>{patient.name}</h3>
                <p>{patient.breed} • {patient.age || '0'}</p>
             </div>
             <div className="patient-meta">
                <span className="meta-label">Tutor</span>
                <span className="meta-value">{patient.tutor}</span>
             </div>
             <div className="patient-meta">
                <span className="meta-label">Última Sessão</span>
                <span className="meta-value">{patient.lastSession ? new Date(patient.lastSession).toLocaleDateString('pt-BR') : 'Nenhuma'}</span>
             </div>
             <div className="patient-status">
                <span className={`status-tag ${getStatusClass(patient.status)}`}>{patient.status || 'Ativo'}</span>
             </div>
                  <button className="btn-view-record" onClick={() => onSelectPatient(patient.id)}>
                    Ver Ficha
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
           </div>
         ))}
      </section>

      {/* Register Patient Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Paciente</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Nome do Paciente</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required placeholder="Ex: Rex" />
              </div>
              
              <div style={{display: 'flex', gap: '16px'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label>Espécie</label>
                  <select name="species" className="form-select" value={formData.species} onChange={handleChange}>
                    <option value="Canino">Canino</option>
                    <option value="Felino">Felino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                  <label>Idade (ex: 2 anos, 8 meses)</label>
                  <input type="text" name="age" className="form-input" value={formData.age} onChange={handleChange} placeholder="Ex: 5 anos" />
                </div>
              </div>

              <div className="form-group">
                <label>Raça</label>
                <input type="text" name="breed" className="form-input" value={formData.breed} onChange={handleChange} placeholder="Ex: Golden Retriever" />
              </div>

              <div className="form-group">
                <label>Nome do Tutor</label>
                <input type="text" name="tutor" className="form-input" value={formData.tutor} onChange={handleChange} required placeholder="Ex: João Silva" />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{border: 'none', cursor: 'pointer'}}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        /* I will move these to App.css if build fails again, but I'll try to keep views clean */
      `}</style>
    </div>
  );
};

export default PatientList;
