"use client";

import type { ExpiryAlertItem, AnomalyAlertItem } from "../domain/types";

interface AnomalyAlertsBlockProps {
  anomalies: AnomalyAlertItem[];
  expired: ExpiryAlertItem[];
  atRisk: ExpiryAlertItem[];
  onCorrect: (item: ExpiryAlertItem) => void;
  onCorrectAnomaly: (item: AnomalyAlertItem) => void;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function AnomalyRow({
  item,
  onCorrect,
}: {
  item: AnomalyAlertItem;
  onCorrect: (item: AnomalyAlertItem) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {item.itemName}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {item.inventoryName} · {item.compartmentName}
        </p>
        {item.comment && (
          <p className="text-xs text-amber-700 mt-0.5 truncate">
            {item.comment}
          </p>
        )}
      </div>
      <button
        type="button"
        data-testid={`btn-correct-anomaly-${item.itemId}`}
        onClick={() => onCorrect(item)}
        className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        Corriger
      </button>
    </li>
  );
}

function ExpiryRow({
  item,
  onCorrect,
}: {
  item: ExpiryAlertItem;
  onCorrect: (item: ExpiryAlertItem) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {item.itemName}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {item.inventoryName} · {item.compartmentName}
        </p>
        {item.comment && (
          <p className="text-xs text-amber-700 mt-0.5 truncate">
            {item.comment}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-slate-500">
          {formatDate(item.latestExpiryDate)}
        </span>
        <button
          type="button"
          data-testid={`btn-correct-${item.itemId}`}
          onClick={() => onCorrect(item)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Corriger
        </button>
      </div>
    </li>
  );
}

export function AnomalyAlertsBlock({
  anomalies,
  expired,
  atRisk,
  onCorrect,
  onCorrectAnomaly,
}: AnomalyAlertsBlockProps) {
  const hasAlerts =
    anomalies.length > 0 || expired.length > 0 || atRisk.length > 0;

  if (!hasAlerts) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 mb-8 flex items-center gap-3">
        <span className="text-emerald-600 font-bold text-lg">✓</span>
        <p className="text-sm text-emerald-700 font-medium">
          Aucune anomalie ou alerte de péremption en cours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl mb-8 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
          Anomalies et alertes actives
        </h2>
      </div>
      <div className="px-5">
        {anomalies.length > 0 && (
          <div className="py-3">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
              Anomalies ({anomalies.length})
            </p>
            <ul>
              {anomalies.map((item) => (
                <AnomalyRow
                  key={`${item.itemId}-${item.controlId}`}
                  item={item}
                  onCorrect={onCorrectAnomaly}
                />
              ))}
            </ul>
          </div>
        )}
        {expired.length > 0 && (
          <div className="py-3">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
              Périmés ({expired.length})
            </p>
            <ul>
              {expired.map((item) => (
                <ExpiryRow
                  key={item.itemId}
                  item={item}
                  onCorrect={onCorrect}
                />
              ))}
            </ul>
          </div>
        )}
        {atRisk.length > 0 && (
          <div className="py-3">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
              Bientôt périmés ({atRisk.length})
            </p>
            <ul>
              {atRisk.map((item) => (
                <ExpiryRow
                  key={item.itemId}
                  item={item}
                  onCorrect={onCorrect}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
