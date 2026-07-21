import React from 'react';

const TABS = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'hoje', label: 'Hoje' },
];

const TopBar = ({ onMenuClick, activeTab = 'visao-geral', onTabChange }) => {
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
              onClick={(e) => { e.preventDefault(); onTabChange && onTabChange(tab.id); }}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="topbar-right">
        <div className="search-container">
          <span className="material-symbols-outlined search-icon">search</span>
          <input type="text" placeholder="Buscar pacientes..." className="search-input" />
        </div>
        <button className="icon-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="icon-btn">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
