import React, { useState } from 'react';
import {
  ANIMAL_SVG_BY_SPECIES,
  BODY_ZONE_HOTSPOTS,
  BODY_ZONES,
  normalizeSpecies,
} from './bodyDiagramData';

const BodyDiagram = ({ selectedZones = [], onChange, species }) => {
  const normalizedSpecies = normalizeSpecies(species);
  const anatomy = ANIMAL_SVG_BY_SPECIES[normalizedSpecies];
  const [viewMode, setViewMode] = useState('lateral');
  const hotspots = BODY_ZONE_HOTSPOTS[viewMode];

  const toggle = (id) => {
    const nextZones = selectedZones.includes(id)
      ? selectedZones.filter(zoneId => zoneId !== id)
      : [...selectedZones, id];
    onChange(nextZones);
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
        Selecione diretamente na imagem as regiões afetadas ou tratadas.
      </p>
      <div className="body-diagram-container">
        <div className="body-diagram-image-map">
          <img
            src={anatomy.images[viewMode]}
            alt={`${anatomy.label}, vista ${viewMode === 'lateral' ? 'lateral' : 'superior'}`}
            width="1536"
            height="1024"
            className="body-diagram-image"
            loading="lazy"
            decoding="async"
          />
          <div className="body-diagram-hotspots" role="group" aria-label={`Regiões do paciente ${anatomy.label}`}>
            {hotspots.map(hotspot => {
              const zone = BODY_ZONES.find(item => item.id === hotspot.id);
              const selected = selectedZones.includes(hotspot.id);
              return (
                <button
                  key={hotspot.id}
                  type="button"
                  className={`body-zone-hotspot ${selected ? 'selected' : ''}`}
                  style={{
                    left: `${hotspot.left}%`,
                    top: `${hotspot.top}%`,
                    width: `${hotspot.width}%`,
                    height: `${hotspot.height}%`,
                  }}
                  aria-label={`${zone.label} — ${anatomy.label}`}
                  aria-pressed={selected}
                  onClick={() => toggle(hotspot.id)}
                >
                  {selected && <span className="body-zone-hotspot-marker" aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

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
