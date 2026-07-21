import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import PatientList from './views/PatientList';
import PatientProfile from './views/PatientProfile';
import SessionsManager from './views/SessionsManager';
import Calendar from './views/Calendar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [topbarTab, setTopbarTab] = useState('visao-geral');

  const handlePatientSelect = (id) => {
    setSelectedPatientId(id);
    setCurrentView('patient-profile');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
  };

  const handleTopbarTab = (tab) => {
    setTopbarTab(tab);
    if (tab === 'hoje' || tab === 'metricas') {
      setCurrentView('sessions');
    }
  };

  const renderContent = () => {
    if (currentView === 'patient-profile') {
      return <PatientProfile patientId={selectedPatientId} onBack={() => setCurrentView('patients')} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectPatient={handlePatientSelect} onNavigate={setCurrentView} />;
      case 'patients':
        return <PatientList onSelectPatient={handlePatientSelect} />;
      case 'sessions':
        return <SessionsManager onSelectPatient={handlePatientSelect} filterToday={topbarTab === 'hoje'} />;
      case 'calendar':
        return <Calendar onSelectPatient={handlePatientSelect} />;
      default:
        return <Dashboard onSelectPatient={handlePatientSelect} onNavigate={setCurrentView} />;
    }
  };

  return (
    <ProtectedRoute>
      <Layout
        activeTab={currentView.startsWith('patient') ? 'patients' : currentView}
        onTabChange={(tab) => { setCurrentView(tab); setTopbarTab('visao-geral'); }}
        onLogout={handleLogout}
        onSelectPatient={handlePatientSelect}
        topbarTab={topbarTab}
        onTopbarTab={handleTopbarTab}
        patients={[]}
      >
        {renderContent()}
      </Layout>
    </ProtectedRoute>
  );
}

export default App;
