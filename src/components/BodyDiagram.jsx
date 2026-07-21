import React from 'react';

const ZONES = [
  { id: 'head',          label: 'Cabeça',           d: 'M200,30 Q220,10 240,15 Q270,8 285,35 Q295,55 280,75 Q260,90 230,88 Q205,80 198,60 Z' },
  { id: 'neck',          label: 'Pescoço',           d: 'M198,62 Q205,82 220,90 Q230,95 240,90 L255,110 Q245,125 225,128 Q205,125 195,108 Z' },
  { id: 'thorax',        label: 'Tórax',             d: 'M195,108 Q205,125 225,128 L255,112 L290,118 Q310,135 315,160 Q310,185 295,195 L250,198 Q225,200 205,195 Q190,185 188,165 Q186,140 195,108 Z' },
  { id: 'lumbar',        label: 'Lombar',            d: 'M295,118 L315,160 Q320,180 315,200 L350,200 Q365,195 375,178 Q380,155 368,135 Q355,118 335,115 Z' },
  { id: 'sacrum',        label: 'Sacro / Cauda',     d: 'M350,200 L375,178 Q380,155 368,135 L400,125 Q420,125 430,140 L440,135 Q450,125 455,110 Q465,100 470,85 L465,208 Q445,215 415,210 Z' },
  { id: 'front_right',   label: 'MMA Direito',       d: 'M188,168 Q178,178 170,200 L165,235 Q163,255 168,270 Q173,285 185,287 Q197,285 202,270 Q205,255 204,235 L205,195 Z' },
  { id: 'front_left',    label: 'MMA Esquerdo',      d: 'M295,195 L297,220 Q298,245 295,265 Q290,280 278,283 Q266,282 262,267 Q258,250 260,230 L262,198 Z' },
  { id: 'rear_right',    label: 'MMP Direito',       d: 'M410,208 L405,240 Q402,265 400,285 Q396,308 385,318 Q373,322 365,315 Q357,305 358,288 Q360,270 365,250 L368,220 L415,210 Z' },
  { id: 'rear_left',     label: 'MMP Esquerdo',      d: 'M465,205 L468,230 Q470,255 468,275 Q465,295 455,308 Q444,318 433,314 Q422,308 422,292 Q422,272 425,252 L428,225 L465,208 Z' },
  { id: 'abdomen',       label: 'Abdômen',           d: 'M205,198 Q225,202 250,200 L295,198 L297,220 Q290,240 260,242 Q235,242 210,238 L205,220 Z' },
];

const BodyDiagram = ({ selectedZones = [], onChange }) => {
  const toggle = (id) => {
    if (selectedZones.includes(id)) {
      onChange(selectedZones.filter(z => z !== id));
    } else {
      onChange([...selectedZones, id]);
    }
  };

  return (
    <div className="body-diagram-wrapper">
      <p className="body-diagram-hint">
        <span className="material-symbols-outlined" style={{fontSize: '14px', verticalAlign: 'middle'}}>touch_app</span>
        {' '}Clique nas regiões corporais afetadas ou tratadas:
      </p>
      <div className="body-diagram-container">
        <svg
          viewBox="0 0 510 340"
          xmlns="http://www.w3.org/2000/svg"
          className="body-diagram-svg"
          aria-label="Diagrama corporal canino"
        >
          {/* Dog outline / background silhouette */}
          <ellipse cx="255" cy="180" rx="200" ry="100" fill="#f5f0e0" stroke="#e0d8c0" strokeWidth="1" />
          
          {/* Zones */}
          {ZONES.map(zone => {
            const selected = selectedZones.includes(zone.id);
            return (
              <g key={zone.id} onClick={() => toggle(zone.id)} style={{ cursor: 'pointer' }}>
                <path
                  d={zone.d}
                  fill={selected ? 'rgba(109, 94, 0, 0.45)' : 'rgba(109, 94, 0, 0.08)'}
                  stroke={selected ? '#6d5e00' : '#b0a060'}
                  strokeWidth={selected ? 2.5 : 1}
                  style={{
                    transition: 'fill 0.2s, stroke 0.2s',
                    filter: selected ? 'drop-shadow(0 0 4px rgba(109,94,0,0.4))' : 'none'
                  }}
                />
              </g>
            );
          })}

          {/* Zone labels (small) */}
          {ZONES.map(zone => {
            // Rough centroid for label - just use a fixed small text near the path
            const selected = selectedZones.includes(zone.id);
            return (
              <text
                key={`label-${zone.id}`}
                className="zone-label"
                style={{
                  fontSize: '7px',
                  fill: selected ? '#6d5e00' : '#8a7a40',
                  fontWeight: selected ? '700' : '500',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                <textPath href={`#${zone.id}-path`} startOffset="10%">
                  {zone.label}
                </textPath>
              </text>
            );
          })}
        </svg>

        {/* Legend chips */}
        <div className="body-diagram-chips">
          {ZONES.map(zone => {
            const selected = selectedZones.includes(zone.id);
            return (
              <button
                key={zone.id}
                type="button"
                className={`toggle-btn ${selected ? 'active' : ''}`}
                style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                onClick={() => toggle(zone.id)}
              >
                {zone.label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedZones.length > 0 && (
        <p className="body-diagram-selected">
          <strong>Regiões selecionadas:</strong> {selectedZones.map(id => ZONES.find(z => z.id === id)?.label).join(', ')}
        </p>
      )}
    </div>
  );
};

export default BodyDiagram;
