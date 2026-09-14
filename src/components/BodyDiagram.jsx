import React, { useState } from 'react';
import {
  ANIMAL_SVG_BY_SPECIES,
  BODY_ZONES,
  normalizeSpecies,
} from './bodyDiagramData';

const BodyDiagram = ({ selectedZones = [], onChange, species }) => {
  const normalizedSpecies = normalizeSpecies(species);
  const anatomy = ANIMAL_SVG_BY_SPECIES[normalizedSpecies];
  const [viewMode, setViewMode] = useState('lateral');

  const toggle = (id) => {
    const nextZones = selectedZones.includes(id)
      ? selectedZones.filter(zoneId => zoneId !== id)
      : [...selectedZones, id];
    onChange(nextZones);
  };

  const handleZoneKeyDown = (event, id) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle(id);
  };

  return (
    <div className="body-diagram-wrapper">
      <div className="body-diagram-heading">
        <div>
          <p className="body-diagram-title">Mapa anatômico</p>
          <span className="body-diagram-species">Paciente {anatomy.label}</span>
        </div>
        <div className="body-diagram-view-toggle" role="group" aria-label="Vista do mapa corporal">
          <button type="button" className={viewMode === 'lateral' ? 'active' : ''} aria-pressed={viewMode === 'lateral'} onClick={() => setViewMode('lateral')}>Lateral</button>
          <button type="button" className={viewMode === 'superior' ? 'active' : ''} aria-pressed={viewMode === 'superior'} onClick={() => setViewMode('superior')}>Superior</button>
        </div>
      </div>
      <p className="body-diagram-hint">
        <span className="material-symbols-outlined" aria-hidden="true">touch_app</span>
        Selecione as regiões corporais afetadas ou tratadas.
      </p>
      <div className="body-diagram-container">
        <svg
          viewBox="0 0 620 340"
          xmlns="http://www.w3.org/2000/svg"
          className="body-diagram-svg"
          role="img"
          aria-labelledby="body-diagram-title body-diagram-description"
        >
          <title id="body-diagram-title">Mapa anatômico veterinário — {anatomy.label}</title>
          <desc id="body-diagram-description">Imagem realista em vista {viewMode === 'lateral' ? 'lateral' : 'superior'} do paciente. Use Tab e Enter ou Espaço para selecionar uma região.</desc>
          <image href={anatomy.images[viewMode]} x="0" y="0" width="620" height="340" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${anatomy.label}, vista ${viewMode === 'lateral' ? 'lateral' : 'superior'}`} />

          {BODY_ZONES.map(zone => {
            const selected = selectedZones.includes(zone.id);
            return (
              <g
                key={zone.id}
                className="body-zone-target"
                role="button"
                tabIndex={0}
                aria-label={`${zone.label} — ${anatomy.label}`}
                aria-pressed={selected}
                onClick={() => toggle(zone.id)}
                onKeyDown={event => handleZoneKeyDown(event, zone.id)}
              >
                <path
                  d={anatomy.zones[zone.id]}
                  className={`body-zone ${selected ? 'selected' : ''}`}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </svg>

        <div className="body-diagram-chips" aria-label="Regiões anatômicas">
          {BODY_ZONES.map(zone => {
            const selected = selectedZones.includes(zone.id);
            return (
              <button
                key={zone.id}
                type="button"
                className={`toggle-btn ${selected ? 'active' : ''}`}
                aria-pressed={selected}
                onClick={() => toggle(zone.id)}
              >
                {zone.label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedZones.length > 0 && (
        <p className="body-diagram-selected" aria-live="polite">
          <strong>Regiões selecionadas:</strong>{' '}
          {selectedZones
            .map(id => BODY_ZONES.find(zone => zone.id === id)?.label)
            .filter(Boolean)
            .join(', ')}
        </p>
      )}
    </div>
  );
};

export default BodyDiagram;
