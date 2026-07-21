import React, { useState, useEffect } from 'react';
import { fetchDB } from '../services/api';

const SessionsManager = ({ onSelectPatient, filterToday = false }) => {
  const [db, setDb] = useState({ patients: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPatient, setFilterPatient] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await fetchDB();
      setDb(data);
      setLoading(false);
    };
    load();

    if (filterToday) {
      const today = new Date().toISOString().split('T')[0];
      setFilterDateFrom(today);
      setFilterDateTo(today);
    }
  }, [filterToday]);

  if (loading) return <div className="sessions-view"><p>Carregando sessões...</p></div>;

  const getPatient = (id) => db.patients.find(p => p.id === id) || { name: 'Paciente não encontrado', species: '' };

  const filtered = [...db.sessions]
    .reverse()
    .filter(s => {
      const patient = getPatient(s.patientId);
      const matchesSearch = search === '' ||
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.notes || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.type || '').toLowerCase().includes(search.toLowerCase());
      const matchesPatient = filterPatient === 'all' || s.patientId === filterPatient;
      const sessionDate = s.date || s.createdAt?.split('T')[0];
      const matchesFrom = !filterDateFrom || sessionDate >= filterDateFrom;
      const matchesTo = !filterDateTo || sessionDate <= filterDateTo;
      return matchesSearch && matchesPatient && matchesFrom && matchesTo;
    });

  const painColor = (scale) => {
    if (scale <= 3) return 'status-active';
    if (scale <= 6) return 'status-maintenance';
    return 'status-recovery';
  };

  return (
    <div className="sessions-view">
      <div className="sessions-header">
        <div>
          <h2>Gerenciador de Sessões</h2>
          <p>{filtered.length} sessão(ões) encontrada(s)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sessions-filters">
        <div className="search-wrapper" style={{flex: 2, minWidth: '200px'}}>
          <span className="material-symbols-outlined">search</span>
          <input
            className="search-input"
            type="text"
            placeholder="Buscar por paciente, tipo ou observações..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" style={{flex: 1, minWidth: '150px'}} value={filterPatient} onChange={e => setFilterPatient(e.target.value)}>
          <option value="all">Todos os pacientes</option>
          {db.patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{display:'flex', gap:'8px', flex:1, flexWrap:'wrap'}}>
          <input type="date" className="form-input" style={{flex:1, minWidth:'120px'}} value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} placeholder="De" />
          <input type="date" className="form-input" style={{flex:1, minWidth:'120px'}} value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} placeholder="Até" />
        </div>
        {(filterDateFrom || filterDateTo || filterPatient !== 'all' || search) && (
          <button className="btn-secondary" style={{whiteSpace:'nowrap'}} onClick={() => {
            setSearch(''); setFilterPatient('all'); setFilterDateFrom(''); setFilterDateTo('');
          }}>Limpar filtros</button>
        )}
      </div>

      {/* Sessions List */}
      {filtered.length === 0 ? (
        <div style={{padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)'}}>
          <span className="material-symbols-outlined" style={{fontSize: '48px', display:'block', marginBottom:'12px'}}>search_off</span>
          Nenhuma sessão encontrada com esses filtros.
        </div>
      ) : (
        <div className="sessions-list-container">
          {filtered.map((session, i) => {
            const patient = getPatient(session.patientId);
            const sessionDate = session.date || session.createdAt?.split('T')[0];
            return (
              <div
                key={i}
                className="session-item"
                onClick={() => onSelectPatient && onSelectPatient(session.patientId)}
                style={{cursor: 'pointer'}}
              >
                <div className="session-date-col">
                  <span className="apt-label">Data</span>
                  <span className="apt-value">{sessionDate ? new Date(sessionDate + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                </div>

                <div className="divider"></div>

                <div className="session-patient-col">
                  <div className="patient-avatar" style={{width:36,height:36}}>
                    <span className="material-symbols-outlined pet-icon" style={{fontSize:18}}>pets</span>
                  </div>
                  <div>
                    <p className="apt-name">{patient.name}</p>
                    <p className="apt-breed">{patient.species} · {patient.tutor || '—'}</p>
                  </div>
                </div>

                <div className="session-type-col">
                  <span className="meta-label">Tipo</span>
                  <span className="meta-value" style={{fontSize:'0.85rem'}}>{session.type || 'Fisioterapia'}</span>
                </div>

                <div className="session-scales-col">
                  {session.painScale !== undefined && (
                    <span className={`status-tag ${painColor(session.painScale)}`}>
                      Dor: {session.painScale}/10
                    </span>
                  )}
                  {session.evolucao && (
                    <span className={`status-tag ${session.evolucao === 'Melhora' ? 'status-active' : session.evolucao === 'Piora' ? 'status-recovery' : 'status-maintenance'}`}>
                      {session.evolucao}
                    </span>
                  )}
                </div>

                {session.bodyRegions && session.bodyRegions.length > 0 && (
                  <div className="session-zones-col">
                    <span className="meta-label">Regiões</span>
                    <span className="meta-value" style={{fontSize:'0.75rem', color:'var(--on-surface-variant)'}}>
                      {session.bodyRegions.slice(0,2).join(', ')}{session.bodyRegions.length > 2 ? `... +${session.bodyRegions.length - 2}` : ''}
                    </span>
                  </div>
                )}

                {session.attachments && session.attachments.length > 0 && (
                  <div className="session-attachments-col">
                    <span className="material-symbols-outlined" style={{fontSize:'18px', color:'var(--primary)'}}>attachment</span>
                    <span style={{fontSize:'0.75rem', color:'var(--on-surface-variant)'}}>{session.attachments.length}</span>
                  </div>
                )}

                <button className="btn-view-record" style={{marginLeft:'auto', flexShrink:0}}>
                  Ver Prontuário
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionsManager;
