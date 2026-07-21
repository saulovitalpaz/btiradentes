import React, { useState, useEffect, useRef } from 'react';
import { fetchDB, addSession, deletePatient, uploadSessionFile } from '../services/api';
import BodyDiagram from '../components/BodyDiagram';
import useIsMobile from '../hooks/useIsMobile';

const TECNICAS_OPTIONS = [
  'Laserterapia', 'Ultrassom Terapêutico', 'TENS / FES', 'Magnetoterapia',
  'Hidroterapia', 'Acupuntura', 'Agulhamento a Seco', 'Termoterapia',
  'Crioterapia', 'Massoterapia', 'Bandagem Funcional',
];

const EXERCICIOS_OPTIONS = [
  'Exercícios de ROM', 'Propriocepção', 'Fortalecimento Muscular',
  'Equilíbrio em Prancha', 'Cavaletti', 'Rampas / Obstáculos',
  'Esteira Subaquática', 'Bola Suíça', 'Sustentação de Peso', 'Alongamento Passivo',
];

const PatientProfile = ({ patientId, onBack }) => {
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Form state
  const [sessionType, setSessionType] = useState('Fisioterapia');
  const [painScale, setPainScale] = useState(5);
  const [mobilidadeScale, setMobilidadeScale] = useState(5);
  const [tecnicas, setTecnicas] = useState([]);
  const [exercicios, setExercicios] = useState([]);
  const [notes, setNotes] = useState('');
  const [evolucao, setEvolucao] = useState('Estável');
  const [peso, setPeso] = useState('');
  const [proximaSessao, setProximaSessao] = useState('');
  const [bodyRegions, setBodyRegions] = useState([]);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);
  
  // Future appointments
  const [upcomingAppts, setUpcomingAppts] = useState([]);

  useEffect(() => {
    const loadProfile = async () => {
      const db = await fetchDB();
      const pt = db.patients.find(p => p.id === patientId);
      if (pt) {
        setPatient(pt);
        setPeso(pt.weight || '');
        const ptSessions = db.sessions
          .filter(s => s.patientId === patientId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(ptSessions);
        
        const ptAppts = (db.appointments || [])
          .filter(a => a.patientId === patientId && a.status !== 'Realizado' && new Date(`${a.date}T${a.time}`) >= new Date())
          .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
        setUpcomingAppts(ptAppts);
      }
      setLoading(false);
    };
    if (patientId) loadProfile();
  }, [patientId]);

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o paciente ${patient?.name} e todo o seu histórico? Esta ação não pode ser desfeita.`)) {
      setLoading(true);
      await deletePatient(patientId);
      onBack();
    }
  };

  const toggleMultiSelect = (value, list, setList) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadFiles(prev => [...prev, ...files]);
    const previews = files.map(f => ({
      name: f.name,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      type: f.type,
    }));
    setUploadPreviews(prev => [...prev, ...previews]);
  };

  const removeUpload = (idx) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== idx));
    setUploadPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadFilesToServer = async (files) => {
    const uploaded = [];
    for (const file of files) {
      try {
        uploaded.push(await uploadSessionFile(file));
      } catch (err) {
        console.error('Upload failed for', file.name, err);
        throw new Error(`Falha ao enviar ${file.name}. Tente novamente.`);
      }
    }
    return uploaded;
  };

  const handleNewSession = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert('Por favor, preencha o campo de Observações antes de finalizar.');
      return;
    }
    setSaving(true);

    let attachments = [];
    try {
      attachments = uploadFiles.length > 0 ? await uploadFilesToServer(uploadFiles) : [];
    } catch (error) {
      setSaving(false);
      alert(error.message);
      return;
    }

    const newSess = await addSession({
      patientId,
      type: sessionType,
      title: `${sessionType} — Dor: ${painScale}/10 | Mobilidade: ${mobilidadeScale}/10`,
      notes,
      tags: [...tecnicas, ...exercicios],
      tecnicas,
      exercicios,
      painScale: Number(painScale),
      mobilidadeScale: Number(mobilidadeScale),
      evolucao,
      peso,
      proximaSessao,
      bodyRegions,
      attachments,
      date: new Date().toISOString().split('T')[0],
    });

    setHistory([newSess, ...history]);
    setNotes(''); setPainScale(5); setMobilidadeScale(5);
    setTecnicas([]); setExercicios([]); setEvolucao('Estável');
    setProximaSessao(''); setBodyRegions([]);
    setUploadFiles([]); setUploadPreviews([]);
    setSaving(false);
    alert('Sessão registrada com sucesso!');
    if (isMobile) setMobileTab('history');
  };

  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState('summary'); // 'summary', 'history', 'new'

  if (loading) return <div className="patient-profile"><p>Carregando perfil...</p></div>;
  if (!patient) return <div className="patient-profile"><p>Paciente não encontrado.</p><button onClick={onBack}>Voltar</button></div>;

  const renderProfileHeader = () => (
    <header className="profile-header">
      <div className="patient-photo" style={{width: isMobile ? 80 : 200, height: isMobile ? 80 : 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container)', borderRadius: 'var(--radius-default)'}}>
        <span className="material-symbols-outlined pet-icon" style={{fontSize: isMobile ? 32 : 64}}>pets</span>
      </div>
      <div className="patient-basic-info">
        <span className="patient-id">ID: {patient.id}</span>
        <h2>{patient.name}</h2>
        <div className="info-cards">
          <div className="info-card"><span className="material-symbols-outlined">category</span><div><p className="meta-label">Raça</p><p className="meta-value">{patient.breed || '—'}</p></div></div>
          {!isMobile && (
            <>
              <div className="info-card"><span className="material-symbols-outlined">cake</span><div><p className="meta-label">Idade</p><p className="meta-value">{patient.age || '—'}</p></div></div>
              <div className="info-card"><span className="material-symbols-outlined">person</span><div><p className="meta-label">Tutor</p><p className="meta-value">{patient.tutor || '—'}</p></div></div>
              <div className="info-card"><span className="material-symbols-outlined">pets</span><div><p className="meta-label">Espécie</p><p className="meta-value">{patient.species || '—'}</p></div></div>
            </>
          )}
        </div>
      </div>
      {!isMobile && (
        <div className="profile-status-card">
          <div className="status-top" style={{ position: 'relative' }}>
            <h3 className="meta-value">Status: {patient.status || 'Ativo'}</h3>
            <p className="meta-label" style={{textTransform: 'none', marginTop: '4px'}}>{patient.description || 'Sem descrição.'}</p>
            <button 
              onClick={handleDelete}
              style={{
                position: 'absolute', top: 0, right: 0, 
                background: 'transparent', border: 'none', color: '#d32f2f', 
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <span className="material-symbols-outlined" style={{fontSize: '16px'}}>delete</span>Excluir
            </button>
            <div style={{marginTop: '12px', display:'flex', gap:'24px', flexWrap:'wrap'}}>
              <div>
                <span className="meta-label">Sessões registradas</span>
                <p className="meta-value" style={{fontSize: '1.5rem'}}>{history.length}</p>
              </div>
              {upcomingAppts.length > 0 && (
                <div>
                  <span className="meta-label">Próxima Agenda</span>
                  <p className="meta-value" style={{fontSize: '0.9rem', color: 'var(--primary)', marginTop: '4px'}}>
                    <span className="material-symbols-outlined" style={{fontSize:'16px', verticalAlign:'middle'}}>event</span>
                    {' '}{new Date(upcomingAppts[0].date + 'T12:00:00').toLocaleDateString('pt-BR')} às {upcomingAppts[0].time}
                  </p>
                </div>
              )}
            </div>
          </div>
          <button className="link-btn" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            Voltar ao Diretório
          </button>
        </div>
      )}
    </header>
  );

  const renderEvolutionChart = () => (
    <div className="chart-card">
      <div className="section-header">
        <h3>Gráfico de Evolução</h3>
        <p className="subtitle">Escala de Dor — últimas sessões</p>
      </div>
      <div className="chart-placeholder" style={{height: isMobile ? '120px' : '150px', background: 'var(--surface-container)', borderRadius: 'var(--radius-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}}>
        {history.filter(h => h.painScale !== undefined).length >= 2 ? (
          <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
            {(() => {
              const pts = [...history].reverse().filter(h => h.painScale !== undefined).slice(-10);
              const step = 400 / (pts.length - 1);
              const points = pts.map((p, i) => `${i * step},${100 - (p.painScale / 10) * 90}`).join(' ');
              return (
                <>
                  <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
                  {pts.map((p, i) => (
                    <circle key={i} cx={i * step} cy={100 - (p.painScale / 10) * 90} r="5" fill="var(--primary)" />
                  ))}
                </>
              );
            })()}
          </svg>
        ) : (
          <p style={{color: 'var(--on-surface-variant)', fontSize: '0.875rem'}}>Registre pelo menos 2 sessões para ver o gráfico.</p>
        )}
      </div>
    </div>
  );

  const renderSessionForm = () => (
    <aside className="new-session-form" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="form-header">
        <h3>Nova Sessão</h3>
        <p style={{fontSize: '0.75rem', opacity: 0.8}}>Registrar atendimento de hoje</p>
      </div>
      <form className="form-body" onSubmit={handleNewSession}>
        {/* Tipo */}
        <div className="form-group">
          <label>Tipo de Sessão</label>
          <select className="form-select" value={sessionType} onChange={e => setSessionType(e.target.value)}>
            <option>Fisioterapia</option>
            <option>Acupuntura</option>
            <option>Avaliação Inicial</option>
            <option>Reavaliação</option>
            <option>Hidroterapia</option>
            <option>Pós-Operatório</option>
          </select>
        </div>

        {/* Cachorrograma */}
        <div className="form-group">
          <label>Cachorrograma — Regiões Corporais</label>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <BodyDiagram selectedZones={bodyRegions} onChange={setBodyRegions} />
          </div>
        </div>

        {/* Escalas */}
        <div style={{display: 'flex', gap: '16px'}}>
          <div className="form-group" style={{flex: 1}}>
            <label>Escala de Dor: <strong>{painScale}/10</strong></label>
            <input type="range" min="0" max="10" value={painScale} onChange={e => setPainScale(e.target.value)} className="form-range" />
          </div>
          <div className="form-group" style={{flex: 1}}>
            <label>Mobilidade: <strong>{mobilidadeScale}/10</strong></label>
            <input type="range" min="0" max="10" value={mobilidadeScale} onChange={e => setMobilidadeScale(e.target.value)} className="form-range" />
          </div>
        </div>

        {/* Evolução */}
        <div className="form-group">
          <label>Evolução vs. sessão anterior</label>
          <div className="toggle-group">
            {['Melhora', 'Estável', 'Piora'].map(opt => (
              <button key={opt} type="button" className={`toggle-btn ${evolucao === opt ? 'active' : ''}`} onClick={() => setEvolucao(opt)}>{opt}</button>
            ))}
          </div>
        </div>

        {/* Peso */}
        <div className="form-group">
          <label>Peso atual (kg)</label>
          <input type="number" step="0.1" className="form-input" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ex: 12.5" />
        </div>

        {/* Técnicas */}
        <div className="form-group">
          <label>Técnicas aplicadas</label>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px'}}>
            {TECNICAS_OPTIONS.map(t => (
              <button key={t} type="button" className={`toggle-btn ${tecnicas.includes(t) ? 'active' : ''}`} style={{flex: 'none', fontSize: '0.75rem'}} onClick={() => toggleMultiSelect(t, tecnicas, setTecnicas)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Exercícios */}
        <div className="form-group">
          <label>Exercícios realizados</label>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px'}}>
            {EXERCICIOS_OPTIONS.map(ex => (
              <button key={ex} type="button" className={`toggle-btn ${exercicios.includes(ex) ? 'active' : ''}`} style={{flex: 'none', fontSize: '0.75rem'}} onClick={() => toggleMultiSelect(ex, exercicios, setExercicios)}>{ex}</button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="form-group">
          <label>Observações e Evolução Clínica <span style={{color:'red'}}>*</span></label>
          <textarea className="form-textarea" placeholder="Descreva a resposta do paciente, comportamento durante a sessão, intercorrências..." rows="5" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
        </div>

        {/* Próxima Sessão */}
        <div className="form-group">
          <label>Próxima sessão agendada</label>
          <input type="date" className="form-input" value={proximaSessao} onChange={e => setProximaSessao(e.target.value)} />
        </div>

        {/* Upload de Imagens */}
        <div className="form-group">
          <label>Anexar imagens / arquivos</label>
          <div
            className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFileChange({ target: { files: e.dataTransfer.files } }); }}
          >
            <span className="material-symbols-outlined" style={{fontSize:'32px', color:'var(--primary)'}}>cloud_upload</span>
            <p>Clique ou arraste imagens / PDFs aqui</p>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" style={{display:'none'}} onChange={handleFileChange} />

          {uploadPreviews.length > 0 && (
            <div className="upload-previews">
              {uploadPreviews.map((p, i) => (
                <div key={i} className="upload-preview-item">
                  {p.url ? (
                    <img src={p.url} alt={p.name} className="upload-preview-img" />
                  ) : (
                    <div className="upload-preview-file">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                  )}
                  <button type="button" className="upload-remove-btn" onClick={() => removeUpload(i)}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="btn-submit" disabled={saving} style={{cursor: saving ? 'not-allowed' : 'pointer'}}>
          {saving ? 'Salvando...' : 'Finalizar e Salvar Sessão'}
        </button>
      </form>
    </aside>
  );

  const renderSessionHistory = () => (
    <div className="history-list">
      <h3 style={{ marginBottom: '16px' }}>Histórico de Sessões</h3>
      {history.length === 0 ? (
        <p style={{color: 'var(--on-surface-variant)', fontSize: '0.9rem', padding: '16px 0'}}>Nenhuma sessão registrada.</p>
      ) : history.map((item, i) => (
        <div key={i} className="patient-row" style={{flexDirection: 'column', alignItems: 'flex-start', marginTop: '16px', backgroundColor: 'var(--surface-container-low)', padding: '16px', borderRadius: 'var(--radius-default)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px'}}>
            <span className="status-tag status-active">{item.type} — {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
            {item.evolucao && <span className={`status-tag ${item.evolucao === 'Melhora' ? 'status-active' : item.evolucao === 'Piora' ? 'status-recovery' : 'status-maintenance'}`}>{item.evolucao}</span>}
          </div>
          <h4 style={{marginTop: '8px'}}>{item.title}</h4>
          <p style={{fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '4px'}}>{item.notes}</p>
          
          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px'}}>
            {item.painScale !== undefined && <span className="status-tag" style={{background:'var(--surface-container-high)'}}>Dor: {item.painScale}/10</span>}
            {item.mobilidadeScale !== undefined && <span className="status-tag" style={{background:'var(--surface-container-high)'}}>Mob: {item.mobilidadeScale}/10</span>}
          </div>

          {(item.bodyRegions || []).length > 0 && (
            <div style={{marginTop: '8px'}}>
              <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px'}}>
                {item.bodyRegions.map(r => <span key={r} className="status-tag" style={{background:'var(--primary-container)', color:'var(--on-primary-container)', fontSize: '0.7rem'}}>{r}</span>)}
              </div>
            </div>
          )}

          {(item.attachments || []).length > 0 && (
            <div className="attachments-gallery" style={{ marginTop: '12px' }}>
              {item.attachments.map((att, ai) => (
                <a key={ai} href={att.url} target="_blank" rel="noreferrer" className="attachment-thumb">
                  {att.type?.startsWith('image/') ? <img src={att.url} alt={att.name} /> : <span className="material-symbols-outlined">description</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div className="patient-profile mobile-view">
        <div style={{ padding: '0 4px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="icon-btn" onClick={onBack}><span className="material-symbols-outlined">arrow_back</span></button>
          <button onClick={handleDelete} style={{ color: '#d32f2f', background:'none', border:'none', fontSize:'0.75rem', fontWeight:700 }}>EXCLUIR</button>
        </div>

        {renderProfileHeader()}

        <div className="mobile-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--outline-variant)', margin: '16px -12px', sticky: 'top', top: 0, backgroundColor: 'var(--surface)', zIndex: 10 }}>
          {['summary', 'history', 'new'].map(tab => (
            <button 
              key={tab} 
              className={`mobile-tab-btn ${mobileTab === tab ? 'active' : ''}`}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1, padding: '12px', border: 'none', background: 'none',
                fontWeight: 700, fontSize: '0.8rem', color: mobileTab === tab ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderBottom: mobileTab === tab ? '3px solid var(--primary)' : 'none'
              }}
            >
              {tab === 'summary' ? 'RESUMO' : tab === 'history' ? 'HISTÓRICO' : 'NOVA SESSÃO'}
            </button>
          ))}
        </div>

        <div className="mobile-tab-content">
          {mobileTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="info-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="info-card"><span className="material-symbols-outlined">cake</span><div><p className="meta-label">Idade</p><p className="meta-value">{patient.age || '—'}</p></div></div>
                <div className="info-card"><span className="material-symbols-outlined">person</span><div><p className="meta-label">Tutor</p><p className="meta-value">{patient.tutor || '—'}</p></div></div>
                <div className="info-card"><span className="material-symbols-outlined">pets</span><div><p className="meta-label">Espécie</p><p className="meta-value">{patient.species || '—'}</p></div></div>
                <div className="info-card"><span className="material-symbols-outlined">scale</span><div><p className="meta-label">Peso (últ.)</p><p className="meta-value">{peso ? `${peso}kg` : '—'}</p></div></div>
              </div>
              {renderEvolutionChart()}
            </div>
          )}
          {mobileTab === 'history' && renderSessionHistory()}
          {mobileTab === 'new' && renderSessionForm()}
        </div>
      </div>
    );
  }

  return (
    <div className="patient-profile desktop-view">
      {renderProfileHeader()}
      <section className="profile-content">
        <div className="history-section">
          {renderEvolutionChart()}
          {renderSessionHistory()}
        </div>
        {renderSessionForm()}
      </section>
    </div>
  );
};

export default PatientProfile;
