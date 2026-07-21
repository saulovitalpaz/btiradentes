import React, { useState, useEffect } from 'react';
import { fetchDB, addAppointment, updateAppointment, deleteAppointment } from '../services/api';

const Calendar = ({ onSelectPatient }) => {
  const [db, setDb] = useState({ patients: [], appointments: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('Sessão Fisioterapia');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchDB();
    if (!data.appointments) data.appointments = [];
    setDb(data);
    if (data.patients.length > 0 && !patientId) {
      setPatientId(data.patients[0].id);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!patientId || !date || !time) return alert('Preencha os campos obrigatórios.');
    await addAppointment({ patientId, date, time, reason, status: 'Agendado' });
    setIsModalOpen(false);
    setDate(''); setTime(''); setReason('Sessão Fisioterapia');
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja cancelar e excluir este agendamento?')) {
      await deleteAppointment(id);
      loadData();
    }
  };

  const handleMarkCompleted = async (id) => {
    await updateAppointment(id, { status: 'Realizado' });
    loadData();
  };

  if (loading) return <div className="calendar-view"><p>Carregando agenda...</p></div>;

  // Sort appointments by date and time
  const sortedAppts = [...db.appointments].sort((a, b) => {
    const dta = new Date(`${a.date}T${a.time}`);
    const dtb = new Date(`${b.date}T${b.time}`);
    return dta - dtb;
  });

  const getPatient = (id) => db.patients.find(p => p.id === id) || { name: 'Paciente Deletado', tutor: '' };

  const getDayLabel = (dateString) => {
    const d = new Date(dateString + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.getTime() === today.getTime()) return 'Hoje';
    if (d.getTime() === tomorrow.getTime()) return 'Amanhã';
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  // Group by date
  const groupedAppts = sortedAppts.reduce((acc, appt) => {
    if (!acc[appt.date]) acc[appt.date] = [];
    acc[appt.date].push(appt);
    return acc;
  }, {});

  const dates = Object.keys(groupedAppts).sort();

  return (
    <div className="calendar-view mobile-optimized">
      <div className="calendar-header">
        <div>
          <h2>Agenda de Atendimentos</h2>
          <p>Próximos agendamentos e histórico recente.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add</span>Novo
        </button>
      </div>

      <div className="calendar-list">
        {dates.length === 0 ? (
          <div className="placeholder-view">
            <span className="material-symbols-outlined" style={{fontSize:'64px'}}>event_busy</span>
            <h3>Nenhum agendamento</h3>
            <p>Sua agenda está vazia. Clique em "Novo" para agendar uma sessão.</p>
          </div>
        ) : (
          dates.map(dateKey => (
            <div key={dateKey} className="calendar-day-group">
              <h3 className="day-header">{getDayLabel(dateKey)}</h3>
              <div className="day-appointments">
                {groupedAppts[dateKey].map(appt => {
                  const pt = getPatient(appt.patientId);
                  const isPast = new Date(`${appt.date}T${appt.time}`) < new Date();
                  const isDone = appt.status === 'Realizado';

                  return (
                    <div key={appt.id} className={`appt-card ${isPast && !isDone ? 'overdue' : ''} ${isDone ? 'done' : ''}`}>
                      <div className="appt-time">
                        {appt.time}
                      </div>
                      <div className="appt-details" onClick={() => onSelectPatient && appt.patientId && pt.name !== 'Paciente Deletado' ? onSelectPatient(appt.patientId) : null}>
                        <h4>{pt.name}</h4>
                        <p>{pt.tutor || '—'} · {appt.reason}</p>
                      </div>
                      <div className="appt-actions">
                        {isDone ? (
                          <span className="status-tag status-active" style={{alignSelf:'center'}}>Realizado</span>
                        ) : (
                          <>
                            <button className="icon-btn action-complete" title="Marcar como Realizado" onClick={() => handleMarkCompleted(appt.id)}>
                              <span className="material-symbols-outlined">check_circle</span>
                            </button>
                            <button className="icon-btn action-delete" title="Cancelar Agendamento" onClick={() => handleDelete(appt.id)}>
                              <span className="material-symbols-outlined">cancel</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content mobile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo Agendamento</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {db.patients.length === 0 ? (
              <p style={{padding:'24px', textAlign:'center', color:'var(--on-surface-variant)'}}>Cadastre um paciente primeiro.</p>
            ) : (
              <form onSubmit={handleCreate} className="mobile-form">
                <div className="form-group">
                  <label>Paciente *</label>
                  <select className="form-select touch-target" value={patientId} onChange={e => setPatientId(e.target.value)} required>
                    {db.patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.tutor}</option>)}
                  </select>
                </div>
                <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                  <div className="form-group" style={{flex:1, minWidth:'140px'}}>
                    <label>Data *</label>
                    <input type="date" className="form-input touch-target" value={date} onChange={e => setDate(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{flex:1, minWidth:'120px'}}>
                    <label>Horário *</label>
                    <input type="time" className="form-input touch-target" value={time} onChange={e => setTime(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Motivo</label>
                  <input type="text" className="form-input touch-target" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Avaliação Inicial" required />
                </div>
                <div className="modal-actions mobile-actions-stack">
                  <button type="button" className="btn-secondary touch-target" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary touch-target">Confirmar Agendamento</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
