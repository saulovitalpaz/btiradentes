import React, { useState } from 'react';
import useIsMobile from '../hooks/useIsMobile';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useAuth } from '../hooks/useAuth';

const Layout = ({ children, activeTab, onTabChange, onLogout, onSelectPatient, topbarTab, onTopbarTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const isMobile = useIsMobile();
  const { updatePassword } = useAuth();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('A confirmação não confere com a nova senha.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
    } catch (error) {
      setPasswordError(error.message || 'Não foi possível alterar a senha.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className={`layout-container ${isMobile ? 'mobile-mode' : 'desktop-mode'}`}>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar only for desktop or as a drawer on mobile (if needed, but currently replaced by BottomNav) */}
      {!isMobile && (
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
      )}

      <div className="main-wrapper">
        <TopBar
          onMenuClick={toggleSidebar}
          activeTab={topbarTab}
          onTabChange={onTopbarTab}
          isMobile={isMobile}
          onSelectPatient={onSelectPatient}
          onChangePassword={() => setIsPasswordModalOpen(true)}
        />
        <main className="content-area">
          {children}
        </main>
        
        {/* Mobile only navigation */}
        {isMobile && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              onTabChange(tab);
            }}
            onSelectPatient={onSelectPatient}
          />
        )}
      </div>

      {isPasswordModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPasswordModalOpen(false)} style={{ zIndex: 500 }}>
          <div className="modal-content mobile-modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Alterar Senha</h3>
              <button className="icon-btn" onClick={() => setIsPasswordModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Senha atual</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.currentPassword}
                  onChange={event => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="form-group">
                <label>Nova senha</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={event => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmar nova senha</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={event => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              {passwordError && <div className="login-error">{passwordError}</div>}
              <div className="modal-actions mobile-actions-stack">
                <button type="button" className="btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isChangingPassword} style={{ border: 'none' }}>
                  {isChangingPassword ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
