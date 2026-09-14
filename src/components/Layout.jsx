import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

const Layout = ({ children, activeTab, onTabChange, onLogout, onSelectPatient, topbarTab, onTopbarTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`layout-container ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          onTabChange(tab);
          setIsSidebarOpen(false);
        }}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        onSelectPatient={onSelectPatient}
      />

      <div className="main-wrapper">
        <TopBar
          onMenuClick={toggleSidebar}
          activeTab={topbarTab}
          onTabChange={onTopbarTab}
          isMobile={isMobile}
          onSelectPatient={onSelectPatient}
        />
        <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
        <main id="main-content" className="content-area">
          {children}
        </main>
        
        {/* Mobile only navigation */}
        {isMobile && !isSidebarOpen && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              onTabChange(tab);
            }}
            onSelectPatient={onSelectPatient}
          />
        )}
      </div>

    </div>
  );
};

export default Layout;
