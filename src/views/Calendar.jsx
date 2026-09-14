import React, { useEffect, useMemo, useState } from 'react';
import { addAppointment, deleteAppointment, fetchAvailability, fetchDB, updateAppointment } from '../services/api';

const WEEKDAYS = [['monday', 'Seg'], ['tuesday', 'Ter'], ['wednesday', 'Qua'], ['thursday', 'Qui'], ['friday', 'Sex'], ['saturday', 'Sáb'], ['sunday', 'Dom']];
const DEFAULT_AVAILABILITY = { intervalMinutes: 30, days: Object.fromEntries(WEEKDAYS.map(([id]) => [id, { enabled: !['saturday', 'sunday'].includes(id), start: '08:00', end: '18:00' }])) };
const pad = value => String(value).padStart(2, '0');
const toDateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromDateKey = value => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const addDays = (date, amount) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
const mondayOf = date => { const next = new Date(date); const day = next.getDay() || 7; next.setDate(next.getDate() - day + 1); return next; };
const getDayKey = date => WEEKDAYS[(date.getDay() || 7) - 1][0];
const formatLongDate = date => date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
const formatShortDate = date => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const buildSlots = (availability, date) => {
  const day = availability?.days?.[getDayKey(date)];
  if (!day?.enabled) return [];
  const [startHour, startMinute] = day.start.split(':').map(Number);
  const [endHour, endMinute] = day.end.split(':').map(Number);
  const interval = availability.intervalMinutes || 30;
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return Array.from({ length: Math.max(0, Math.ceil((end - start) / interval)) }, (_, index) => { const total = start + index * interval; return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`; });
};

const Modal = ({ title, children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content mobile-modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title" onClick={event => event.stopPropagation()}>
      <div className="modal-header"><h3 id="calendar-modal-title">{title}</h3><button type="button" className="icon-btn" aria-label="Fechar janela" onClick={onClose}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></div>
      {children}
    </div>
  </div>
);

const Calendar = ({ onSelectPatient }) => {
  const todayKey = toDateKey(new Date());
  const [db, setDb] = useState({ patients: [], appointments: [] });
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => new URLSearchParams(window.location.search).get('calendarView') || 'day');
  const [selectedDate, setSelectedDate] = useState(() => new URLSearchParams(window.location.search).get('calendarDate') || todayKey);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [form, setForm] = useState({ patientId: '', date: todayKey, time: '08:00', reason: 'Sessão Fisioterapia', isFixed: false, pattern: 'weekly', total: 1 });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [data, agendaAvailability] = await Promise.all([fetchDB(), fetchAvailability().catch(() => null)]);
    setDb({ ...data, appointments: data.appointments || [] });
    setAvailability(agendaAvailability || DEFAULT_AVAILABILITY);
    setForm(current => ({ ...current, patientId: current.patientId || data.patients?.[0]?.id || '' }));
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);
  useEffect(() => { const params = new URLSearchParams(window.location.search); params.set('calendarView', view); params.set('calendarDate', selectedDate); window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`); }, [view, selectedDate]);

  const date = fromDateKey(selectedDate);
  const patientById = useMemo(() => new Map(db.patients.map(patient => [patient.id, patient])), [db.patients]);
  const appointmentsByDate = useMemo(() => db.appointments.reduce((groups, appointment) => { (groups[appointment.date] ||= []).push(appointment); return groups; }, {}), [db.appointments]);
  const openCreate = (dateValue = selectedDate, timeValue = '') => { setForm(current => ({ ...current, date: dateValue, time: timeValue || buildSlots(availability, fromDateKey(dateValue))[0] || '08:00' })); setConflicts([]); setIsCreateOpen(true); };
  const navigate = amount => setSelectedDate(toDateKey(addDays(date, amount * (view === 'month' ? 30 : view === 'week' ? 7 : 1))));

  const handleCreate = async event => {
    event.preventDefault(); setSaving(true);
    try {
      const result = await addAppointment({ patientId: form.patientId, date: form.date, time: form.time, reason: form.reason, status: 'Agendado', ...(form.isFixed ? { recurrence: { pattern: form.pattern, total: Number(form.total) } } : {}) });
      setConflicts(result.conflicts || []);
      if (result.created?.length) { setIsCreateOpen(false); await loadData(); }
    } catch (error) { setConflicts([{ reason: error.message }]); } finally { setSaving(false); }
  };
  const handleEdit = async event => {
    event.preventDefault(); setSaving(true);
    try { await updateAppointment(editingAppointment.id, { patientId: editingAppointment.patientId, date: editingAppointment.date, time: editingAppointment.time, reason: editingAppointment.reason, status: editingAppointment.status }); setEditingAppointment(null); await loadData(); }
    catch (error) { setConflicts([{ reason: error.message }]); } finally { setSaving(false); }
  };
  const markDone = async appointment => { await updateAppointment(appointment.id, { status: 'Realizado' }); setEditingAppointment(null); await loadData(); };
  const removeAppointment = async appointment => { if (!window.confirm('Cancelar e excluir este agendamento?')) return; await deleteAppointment(appointment.id); setEditingAppointment(null); await loadData(); };

  const renderAppointment = appointment => {
    const patient = patientById.get(appointment.patientId) || { name: 'Paciente não encontrado' };
    return <button type="button" key={appointment.id} className={`calendar-appointment ${appointment.status === 'Realizado' ? 'is-done' : ''}`} onClick={() => { setConflicts([]); setEditingAppointment({ ...appointment }); }}><span className="calendar-appointment-time">{appointment.time}</span><span className="calendar-appointment-name">{patient.name}</span><span className="calendar-appointment-reason">{appointment.reason || 'Sessão'}</span></button>;
  };

  const renderDay = () => {
    const slots = buildSlots(availability, date); const dayAppointments = appointmentsByDate[selectedDate] || [];
    return <div className="calendar-day-grid">{!slots.length && <div className="calendar-empty-day">Não há horários disponíveis neste dia.</div>}{slots.map(time => { const items = dayAppointments.filter(appointment => appointment.time === time); return <div className="calendar-time-row" key={time}><span className="calendar-time-label">{time}</span><div className="calendar-slot-content">{items.map(renderAppointment)}{!items.length && <button type="button" className="calendar-slot-add" aria-label={`Agendar às ${time}`} onClick={() => openCreate(selectedDate, time)}><span aria-hidden="true">+</span></button>}</div></div>; })}</div>;
  };

  const renderWeek = () => { const start = mondayOf(date); return <div className="calendar-week-list">{Array.from({ length: 7 }, (_, index) => { const day = addDays(start, index); const key = toDateKey(day); const items = [...(appointmentsByDate[key] || [])].sort((a, b) => a.time.localeCompare(b.time)); return <section className={`calendar-week-day ${key === todayKey ? 'is-today' : ''}`} key={key}><div className="calendar-week-day-header"><div><strong>{day.toLocaleDateString('pt-BR', { weekday: 'long' })}</strong><span>{formatShortDate(day)}</span></div><button type="button" className="icon-btn compact" aria-label={`Novo atendimento em ${formatShortDate(day)}`} onClick={() => openCreate(key)}><span aria-hidden="true">+</span></button></div>{items.length ? <div className="calendar-week-appointments">{items.map(renderAppointment)}</div> : <p className="calendar-week-empty">Sem agendamentos</p>}</section>; })}</div>; };

  const renderMonth = () => { const first = new Date(date.getFullYear(), date.getMonth(), 1, 12); const gridStart = mondayOf(first); const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index)); return <div className="calendar-month-layout"><div className="calendar-month-card"><div className="calendar-weekday-row">{WEEKDAYS.map(([, label]) => <span key={label}>{label}</span>)}</div><div className="calendar-month-grid">{days.map(day => { const key = toDateKey(day); const count = appointmentsByDate[key]?.length || 0; const isCurrentMonth = day.getMonth() === date.getMonth(); return <button type="button" key={key} className={`calendar-month-day ${isCurrentMonth ? '' : 'is-outside'} ${key === selectedDate ? 'is-selected' : ''} ${key === todayKey ? 'is-today' : ''}`} onClick={() => setSelectedDate(key)}><span>{day.getDate()}</span>{count > 0 && <span className="calendar-count" aria-label={`${count} agendamento${count > 1 ? 's' : ''}`}>{count}</span>}</button>; })}</div></div><aside className="calendar-day-drawer"><div className="calendar-drawer-header"><div><span className="meta-label">Selecionado</span><h3>{formatLongDate(date)}</h3></div><button type="button" className="btn-secondary compact" onClick={() => openCreate(selectedDate)}>Novo</button></div>{(appointmentsByDate[selectedDate] || []).length ? <div className="calendar-drawer-list">{appointmentsByDate[selectedDate].map(renderAppointment)}</div> : <p className="calendar-week-empty">Sem agendamentos neste dia.</p>}</aside></div>; };

  if (loading) return <div className="calendar-view"><p>Carregando agenda…</p></div>;
  return <div className="calendar-view"><header className="calendar-header calendar-page-header"><div><h2>Calendário</h2><p>{view === 'day' ? formatLongDate(date) : date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p></div><button type="button" className="btn-primary" onClick={() => openCreate()}><span className="material-symbols-outlined" aria-hidden="true">add</span>Novo agendamento</button></header><div className="calendar-toolbar"><div className="calendar-period-label"><strong>{view === 'week' ? `${formatShortDate(mondayOf(date))} – ${formatShortDate(addDays(mondayOf(date), 6))}` : view === 'month' ? date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : formatLongDate(date)}</strong></div><button type="button" className="btn-secondary compact" onClick={() => setSelectedDate(todayKey)}>Hoje</button><div className="calendar-view-switcher" role="group" aria-label="Visualização da agenda">{['day', 'week', 'month'].map(option => <button type="button" key={option} className={view === option ? 'active' : ''} aria-pressed={view === option} onClick={() => setView(option)}>{option === 'day' ? 'Dia' : option === 'week' ? 'Semana' : 'Mês'}</button>)}</div><div className="calendar-navigation"><button type="button" className="icon-btn" aria-label="Período anterior" onClick={() => navigate(-1)}>‹</button><button type="button" className="icon-btn" aria-label="Próximo período" onClick={() => navigate(1)}>›</button></div></div>{view === 'day' && renderDay()}{view === 'week' && renderWeek()}{view === 'month' && renderMonth()}
    {isCreateOpen && <Modal title="Novo agendamento" onClose={() => setIsCreateOpen(false)}>{db.patients.length === 0 ? <p className="modal-empty-state">Cadastre um paciente antes de criar um agendamento.</p> : <form onSubmit={handleCreate} className="calendar-form"><div className="form-group"><label htmlFor="appointment-patient">Paciente *</label><select id="appointment-patient" className="form-select" value={form.patientId} onChange={event => setForm({ ...form, patientId: event.target.value })} required>{db.patients.map(patient => <option value={patient.id} key={patient.id}>{patient.name} — {patient.tutor}</option>)}</select></div><div className="form-row"><div className="form-group"><label htmlFor="appointment-date">Data *</label><input id="appointment-date" name="date" type="date" className="form-input" value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} required /></div><div className="form-group"><label htmlFor="appointment-time">Horário *</label><input id="appointment-time" name="time" type="time" className="form-input" value={form.time} onChange={event => setForm({ ...form, time: event.target.value })} required /></div></div><div className="form-group"><label htmlFor="appointment-reason">Motivo</label><input id="appointment-reason" name="reason" className="form-input" value={form.reason} onChange={event => setForm({ ...form, reason: event.target.value })} placeholder="Ex.: Avaliação inicial…" /></div><label className="checkbox-field"><input type="checkbox" checked={form.isFixed} onChange={event => setForm({ ...form, isFixed: event.target.checked })} /><span><strong>Paciente fixo</strong><small>Adicionar recorrências futuras automaticamente</small></span></label>{form.isFixed && <div className="recurrence-fields"><div className="form-group"><label htmlFor="appointment-pattern">Periodicidade</label><select id="appointment-pattern" className="form-select" value={form.pattern} onChange={event => setForm({ ...form, pattern: event.target.value })}><option value="weekly">Semanal</option><option value="fortnightly">Quinzenal</option></select></div><div className="form-group"><label htmlFor="appointment-total">Total de sessões</label><input id="appointment-total" type="number" min="2" max="52" className="form-input" value={form.total} onChange={event => setForm({ ...form, total: event.target.value })} /></div></div>}{conflicts.length > 0 && <div className="form-feedback" role="alert">{conflicts.length === 1 ? conflicts[0].reason : `${conflicts.length} ocorrências não foram criadas por conflito de horário.`}</div>}<div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Confirmar agendamento'}</button></div></form>}</Modal>}
    {editingAppointment && <Modal title="Detalhes do atendimento" onClose={() => setEditingAppointment(null)}><form onSubmit={handleEdit} className="calendar-form"><div className="appointment-detail-summary"><strong>{patientById.get(editingAppointment.patientId)?.name || 'Paciente não encontrado'}</strong><span>{editingAppointment.status}</span></div><div className="form-row"><div className="form-group"><label htmlFor="edit-appointment-date">Data *</label><input id="edit-appointment-date" type="date" className="form-input" value={editingAppointment.date} onChange={event => setEditingAppointment({ ...editingAppointment, date: event.target.value })} required /></div><div className="form-group"><label htmlFor="edit-appointment-time">Horário *</label><input id="edit-appointment-time" type="time" className="form-input" value={editingAppointment.time} onChange={event => setEditingAppointment({ ...editingAppointment, time: event.target.value })} required /></div></div><div className="form-group"><label htmlFor="edit-appointment-reason">Motivo</label><input id="edit-appointment-reason" className="form-input" value={editingAppointment.reason || ''} onChange={event => setEditingAppointment({ ...editingAppointment, reason: event.target.value })} /></div><div className="form-group"><label htmlFor="edit-appointment-status">Status</label><select id="edit-appointment-status" className="form-select" value={editingAppointment.status || 'Agendado'} onChange={event => setEditingAppointment({ ...editingAppointment, status: event.target.value })}><option>Agendado</option><option>Confirmado</option><option>Realizado</option><option>Cancelado</option></select></div>{conflicts.length > 0 && <div className="form-feedback" role="alert">{conflicts[0].reason}</div>}<div className="modal-actions appointment-actions"><button type="button" className="btn-danger-outline" onClick={() => removeAppointment(editingAppointment)}>Excluir</button><div><button type="button" className="btn-secondary" onClick={() => setEditingAppointment(null)}>Fechar</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button></div></div>{editingAppointment.status !== 'Realizado' && <button type="button" className="link-btn" onClick={() => markDone(editingAppointment)}>Marcar como realizado</button>}{onSelectPatient && <button type="button" className="link-btn" onClick={() => { setEditingAppointment(null); onSelectPatient(editingAppointment.patientId); }}>Abrir prontuário do paciente</button>}</form></Modal>}
  </div>;
};

export default Calendar;
