import React from 'react';

const ZONES = [
  { id: 'head', label: 'Cabeça', d: 'M126 109 C132 83 158 67 187 73 C210 78 225 96 225 116 C225 139 204 156 176 154 C150 152 127 136 126 109Z' },
  { id: 'neck', label: 'Pescoço', d: 'M182 147 C200 143 215 132 224 116 C239 127 254 143 263 163 C252 180 232 190 209 188 C193 180 184 166 182 147Z' },
  { id: 'thorax', label: 'Tórax', d: 'M209 188 C219 151 249 130 291 127 C330 124 361 143 374 174 C370 209 343 232 302 236 C258 240 224 221 209 188Z' },
  { id: 'lumbar', label: 'Lombar', d: 'M365 143 C404 141 439 154 462 177 C464 210 442 235 401 241 C363 236 347 210 374 174 C373 163 370 153 365 143Z' },
  { id: 'sacrum', label: 'Sacro / Cauda', d: 'M452 174 C474 169 494 155 510 132 C515 155 504 178 480 199 C479 220 461 236 432 242 C446 223 465 199 452 174Z' },
  { id: 'front_right', label: 'MMA Direito', d: 'M219 208 C231 212 240 219 244 231 C247 255 240 285 226 299 C214 310 201 304 200 285 C199 262 205 229 219 208Z' },
  { id: 'front_left', label: 'MMA Esquerdo', d: 'M293 232 C309 232 321 240 325 253 C327 275 319 297 304 307 C291 315 281 309 279 292 C276 271 282 246 293 232Z' },
  { id: 'rear_right', label: 'MMP Direito', d: 'M398 238 C414 235 428 241 435 254 C437 278 429 302 414 314 C401 324 388 319 386 301 C383 279 388 253 398 238Z' },
  { id: 'rear_left', label: 'MMP Esquerdo', d: 'M457 229 C472 224 486 230 492 244 C496 268 491 294 477 309 C466 320 451 316 448 298 C445 276 449 247 457 229Z' },
  { id: 'abdomen', label: 'Abdômen', d: 'M296 234 C329 237 369 239 405 237 C396 256 372 269 335 270 C300 271 270 260 255 240 C268 236 282 234 296 234Z' },
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
          viewBox="0 0 560 330"
          xmlns="http://www.w3.org/2000/svg"
          className="body-diagram-svg"
          aria-label="Diagrama corporal veterinário"
        >
          <g className="animal-silhouette" aria-hidden="true">
            <path
              className="animal-body"
              d="M178 147 C196 105 244 86 306 91 C378 97 442 127 478 174 C489 189 481 215 456 232 C424 255 363 261 298 251 C237 242 193 218 177 184 C172 173 171 158 178 147Z"
            />
            <path className="animal-neck" d="M179 145 C196 137 212 123 224 103 C240 119 259 141 268 164 C253 183 229 193 205 187 C190 178 181 164 179 145Z" />
            <path className="animal-head" d="M121 109 C126 80 154 60 188 66 C213 70 232 90 235 113 C238 139 216 162 181 160 C150 158 124 139 121 109Z" />
            <path className="animal-muzzle" d="M123 109 C102 108 88 118 82 133 C100 142 122 137 135 124" />
            <path className="animal-ear" d="M179 69 C194 42 220 46 225 76 C213 80 197 78 179 69Z" />
            <path className="animal-tail" d="M474 176 C497 166 512 149 520 121 C530 150 516 184 483 204" />
            <path className="animal-leg" d="M221 209 C235 216 244 234 242 252 C239 276 229 299 215 304 C202 296 201 271 207 247 C210 232 214 219 221 209Z" />
            <path className="animal-leg" d="M294 231 C313 234 325 248 324 267 C322 288 311 306 298 310 C286 303 282 281 286 261 C288 248 290 239 294 231Z" />
            <path className="animal-leg" d="M400 237 C418 237 432 250 433 269 C434 290 423 310 409 316 C395 309 391 285 394 263 C396 252 397 243 400 237Z" />
            <path className="animal-leg" d="M459 228 C478 224 491 238 493 258 C495 281 487 303 473 312 C459 306 453 282 455 259 C456 246 457 236 459 228Z" />
          </g>

          {ZONES.map(zone => {
            const selected = selectedZones.includes(zone.id);
            return (
              <g key={zone.id} onClick={() => toggle(zone.id)} style={{ cursor: 'pointer' }}>
                <path
                  d={zone.d}
                  className={`body-zone ${selected ? 'selected' : ''}`}
                />
              </g>
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
