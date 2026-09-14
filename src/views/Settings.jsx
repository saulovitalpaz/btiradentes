import React, { useEffect, useState } from 'react';
import { fetchAvailability, saveAvailability } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const DAYS = [
  ['monday', 'Segunda-feira'], ['tuesday', 'Terça-feira'], ['wednesday', 'Quarta-feira'],
  ['thursday', 'Quinta-feira'], ['friday', 'Sexta-feira'], ['saturday', 'Sábado'], ['sunday', 'Domingo'],
];
const fallback = { intervalMinutes: 30, days: Object.fromEntries(DAYS.map(([id]) => [id, { enabled: !['saturday', 'sunday'].includes(id), start: '08:00', end: '18:00' }])) };

const Settings = ({ section = 'password', onSectionChange }) => {
  const { updatePassword } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [availability, setAvailability] = useState(fallback);
  const [loading, setLoading] = useState(section === 'availability');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (section !== 'availability') return;
    fetchAvailability().then(value => setAvailability(value || fallback)).catch(() => setError('Não foi possível carregar os horários disponíveis.')).finally(() => setLoading(false));
  }, [section]);

  const changePassword = async event => {
    event.preventDefault(); setError(''); setFeedback('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setError('A confirmação não confere com a nova senha.'); return; }
    setSaving(true);
    try { await updatePassword(passwordForm.currentPassword, passwordForm.newPassword); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setFeedback('Senha alterada. Faça login novamente para continuar.'); }
    catch (requestError) { setError(requestError.message || 'Não foi possível alterar a senha.'); }
    finally { setSaving(false); }
  };

  const saveHours = async event => {
    event.preventDefault(); setError(''); setFeedback(''); setSaving(true);
    try { const value = await saveAvailability(availability); setAvailability(value); setFeedback('Horários disponíveis atualizados.'); }
    catch (requestError) { setError(requestError.message || 'Não foi possível salvar os horários.'); }
    finally { setSaving(false); }
  };

  return <div className="settings-view"><header className="view-header"><div className="header-info"><h2>Configurações</h2><p>Gerencie acesso e horários da clínica.</p></div></header><div className="settings-tabs" role="tablist" aria-label="Seções de configurações"><a href="#settings-password" className={section === 'password' ? 'active' : ''} role="tab" aria-selected={section === 'password'} onClick={event => { event.preventDefault(); onSectionChange?.('settings-password'); }}>Senha</a><a href="#settings-availability" className={section === 'availability' ? 'active' : ''} role="tab" aria-selected={section === 'availability'} onClick={event => { event.preventDefault(); onSectionChange?.('settings-availability'); }}>Horários de atendimento</a></div>
    {section === 'password' && <section className="settings-card"><div className="section-header"><div><h3>Alterar senha</h3><p className="subtitle">Use pelo menos 8 caracteres e não compartilhe sua senha.</p></div></div><form onSubmit={changePassword} className="settings-form"><div className="form-group"><label htmlFor="settings-current-password">Senha atual</label><input id="settings-current-password" name="currentPassword" type="password" className="form-input" value={passwordForm.currentPassword} onChange={event => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} autoComplete="current-password" required /></div><div className="form-group"><label htmlFor="settings-new-password">Nova senha</label><input id="settings-new-password" name="newPassword" type="password" className="form-input" value={passwordForm.newPassword} onChange={event => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} autoComplete="new-password" minLength={8} required /></div><div className="form-group"><label htmlFor="settings-confirm-password">Confirmar nova senha</label><input id="settings-confirm-password" name="confirmPassword" type="password" className="form-input" value={passwordForm.confirmPassword} onChange={event => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} autoComplete="new-password" minLength={8} required /></div>{error && <p className="form-feedback" role="alert">{error}</p>}{feedback && <p className="form-success" role="status" aria-live="polite">{feedback}</p>}<button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar nova senha'}</button></form></section>}
    {section === 'availability' && <section className="settings-card"><div className="section-header"><div><h3>Horários disponíveis</h3><p className="subtitle">A agenda exibirá slots de 30 em 30 minutos dentro destes intervalos.</p></div></div>{loading ? <p>Carregando horários…</p> : <form onSubmit={saveHours} className="settings-form"><div className="availability-list">{DAYS.map(([id, label]) => { const day = availability.days[id]; return <div className={`availability-row ${day.enabled ? '' : 'is-disabled'}`} key={id}><label className="availability-day"><input type="checkbox" checked={day.enabled} onChange={event => setAvailability({ ...availability, days: { ...availability.days, [id]: { ...day, enabled: event.target.checked } } })} /><strong>{label}</strong></label><div className="availability-times"><div className="form-group"><label htmlFor={`${id}-start`}>Início</label><input id={`${id}-start`} type="time" className="form-input" value={day.start} disabled={!day.enabled} onChange={event => setAvailability({ ...availability, days: { ...availability.days, [id]: { ...day, start: event.target.value } } })} /></div><span aria-hidden="true">até</span><div className="form-group"><label htmlFor={`${id}-end`}>Fim</label><input id={`${id}-end`} type="time" className="form-input" value={day.end} disabled={!day.enabled} onChange={event => setAvailability({ ...availability, days: { ...availability.days, [id]: { ...day, end: event.target.value } } })} /></div></div></div>; })}</div>{error && <p className="form-feedback" role="alert">{error}</p>}{feedback && <p className="form-success" role="status" aria-live="polite">{feedback}</p>}<button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar horários'}</button></form>}</section>}
  </div>;
};

export default Settings;
