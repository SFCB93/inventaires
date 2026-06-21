export function SwipeTutorial() {
  return (
    <div className="grid grid-cols-3 gap-2 mb-8">
      <div className="flex flex-col items-center gap-1.5 bg-amber-50 rounded-xl py-3 px-1">
        <svg viewBox="0 0 56 48" className="w-14 h-12" aria-hidden="true">
          {/* BG card */}
          <g transform="translate(2, 6)">
            <rect width="32" height="20" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
            <line x1="5" y1="7" x2="27" y2="7" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="13" x2="19" y2="13" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round"/>
          </g>
          {/* FG card — décalée à droite, légère inclinaison */}
          <g transform="translate(18, 4) rotate(5, 16, 10)">
            <rect width="32" height="20" rx="3" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5"/>
            <line x1="5" y1="7" x2="27" y2="7" stroke="#fcd34d" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="13" x2="19" y2="13" stroke="#fcd34d" strokeWidth="1" strokeLinecap="round"/>
          </g>
          {/* Flèche droite */}
          <line x1="12" y1="37" x2="44" y2="37" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
          <polyline points="40,33 48,37 40,41" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-amber-700 text-xs font-semibold text-center leading-tight">⚠ Anomalie</span>
      </div>

      <div className="flex flex-col items-center gap-1.5 bg-emerald-50 rounded-xl py-3 px-1">
        <svg viewBox="0 0 56 48" className="w-14 h-12" aria-hidden="true">
          {/* BG card */}
          <g transform="translate(22, 6)">
            <rect width="32" height="20" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
            <line x1="5" y1="7" x2="27" y2="7" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="13" x2="19" y2="13" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round"/>
          </g>
          {/* FG card — décalée à gauche, légère inclinaison inverse */}
          <g transform="translate(6, 4) rotate(-5, 16, 10)">
            <rect width="32" height="20" rx="3" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5"/>
            <line x1="5" y1="7" x2="27" y2="7" stroke="#6ee7b7" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="13" x2="19" y2="13" stroke="#6ee7b7" strokeWidth="1" strokeLinecap="round"/>
          </g>
          {/* Flèche gauche */}
          <line x1="44" y1="37" x2="12" y2="37" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
          <polyline points="16,33 8,37 16,41" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-emerald-700 text-xs font-semibold text-center leading-tight">✓ Présent</span>
      </div>

      <div className="flex flex-col items-center gap-1.5 bg-slate-100 rounded-xl py-3 px-1">
        <svg viewBox="0 0 56 48" className="w-14 h-12" aria-hidden="true">
          {/* BG card */}
          <g transform="translate(4, 2)">
            <rect width="32" height="18" rx="3" fill="white" stroke="#e2e8f0" strokeWidth="1.5"/>
            <line x1="5" y1="6" x2="27" y2="6" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round"/>
          </g>
          {/* FG card — décalée vers le bas, légère inclinaison */}
          <g transform="translate(4, 16) rotate(3, 16, 9)">
            <rect width="32" height="18" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5"/>
            <line x1="5" y1="6" x2="27" y2="6" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round"/>
          </g>
          {/* Flèche bas (côté droit) */}
          <line x1="48" y1="4" x2="48" y2="36" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
          <polyline points="44,33 48,41 52,33" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-slate-600 text-xs font-semibold text-center leading-tight">✕ Absent</span>
      </div>
    </div>
  )
}
