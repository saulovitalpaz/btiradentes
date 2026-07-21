import React, { useEffect, useRef, useState } from 'react';
import { searchRecords } from '../services/api';

const TABS = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'hoje', label: 'Hoje' },
];

const TopBar = ({ onMenuClick, activeTab = 'visao-geral', onTabChange, onSelectPatient, onChangePassword }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ patients: [], sessions: [], appointments: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    let isActive = true;
    const timeout = window.setTimeout(() => {
      searchRecords(trimmed)
        .then((data) => {
          if (isActive) {
            setResults(data);
            setIsSearchOpen(true);
          }
        })
        .catch(() => {
          if (isActive) setResults({ patients: [], sessions: [], appointments: [] });
        })
        .finally(() => {
          if (isActive) setIsSearching(false);
        });
    }, 200);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  const resultCount = results.patients.length + results.sessions.length + results.appointments.length;

  const selectPatient = (patientId) => {
    if (!patientId || !onSelectPatient) return;
    setQuery('');
    setIsSearchOpen(false);
    onSelectPatient(patientId);
  };

  const renderResultButton = ({ key, icon, title, meta, patientId }) => (
    <button key={key} className="search-result-item" type="button" onClick={() => selectPatient(patientId)}>
      <span className="material-symbols-outlined">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{meta}</small>
      </span>
    </button>
  );

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn menu-btn" onClick={onMenuClick}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="topbar-title">Portal da Clínica</span>
        <nav className="topbar-nav hide-on-mobile">
          {TABS.map(tab => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className={`topbar-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={(event) => {
                event.preventDefault();
                onTabChange && onTabChange(tab.id);
              }}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="topbar-right">
        <div className="search-container" ref={searchRef}>
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Buscar pacientes, sessões..."
            className="search-input"
            value={query}
            onChange={event => {
              const value = event.target.value;
              setQuery(value);
              setIsSearchOpen(true);
              if (value.trim().length < 2) {
                setResults({ patients: [], sessions: [], appointments: [] });
                setIsSearching(false);
              } else {
                setIsSearching(true);
              }
            }}
            onFocus={() => query.trim().length >= 2 && setIsSearchOpen(true)}
          />
          {isSearchOpen && query.trim().length >= 2 && (
            <div className="search-results-popover">
              {isSearching ? (
                <p className="search-empty">Buscando...</p>
              ) : resultCount === 0 ? (
                <p className="search-empty">Nenhum resultado encontrado.</p>
              ) : (
                <>
                  {results.patients.map(patient => renderResultButton({
                    key: `patient-${patient.id}`,
                    icon: 'pets',
                    title: patient.name,
                    meta: `${patient.tutor || 'Tutor não informado'} · ${patient.status || 'Sem status'}`,
                    patientId: patient.id,
                  }))}
                  {results.sessions.map(session => renderResultButton({
                    key: `session-${session.id}`,
                    icon: 'clinical_notes',
                    title: session.patientName,
                    meta: `${session.type || 'Sessão'} · ${session.notes || session.title || 'Sem observações'}`,
                    patientId: session.patientId,
                  }))}
                  {results.appointments.map(appointment => renderResultButton({
                    key: `appointment-${appointment.id}`,
                    icon: 'event',
                    title: appointment.patientName,
                    meta: `${appointment.date || ''} ${appointment.time || ''} · ${appointment.reason || 'Agendamento'}`,
                    patientId: appointment.patientId,
                  }))}
                </>
              )}
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={onChangePassword} title="Alterar senha">
          <span className="material-symbols-outlined">lock_reset</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
