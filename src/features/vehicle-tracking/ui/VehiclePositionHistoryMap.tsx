'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet'
import type { PositionPoint } from '../domain/types'
import { formatDateTime } from '@/shared/lib/format'

interface VehiclePositionHistoryMapProps {
  positions: PositionPoint[]
  isLoading?: boolean
}

export function VehiclePositionHistoryMap({ positions, isLoading = false }: VehiclePositionHistoryMapProps) {
  if (isLoading) {
    return (
      <div className="h-96 w-full rounded-2xl bg-slate-100 animate-pulse" data-testid="position-history-skeleton" />
    )
  }

  if (positions.length === 0) {
    return (
      <div
        className="h-96 w-full rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center"
        data-testid="position-history-empty"
      >
        <div className="text-5xl mb-4" aria-hidden="true">🗺️</div>
        <p className="text-slate-600 font-medium">Aucune position enregistrée sur cette période.</p>
      </div>
    )
  }

  const path = positions.map((point) => [point.lat, point.lng] as [number, number])
  const last = positions[positions.length - 1]

  return (
    <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-200" data-testid="position-history-map">
      <MapContainer center={[last.lat, last.lng]} zoom={13} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Polyline positions={path} pathOptions={{ color: '#2563eb', weight: 3 }} />
        {positions.map((point, index) => (
          <CircleMarker
            key={index}
            center={[point.lat, point.lng]}
            radius={index === positions.length - 1 ? 7 : 4}
            pathOptions={{
              color: point.isCircuitCut ? '#dc2626' : '#059669',
              fillOpacity: 0.8,
            }}
          >
            <Popup>{formatDateTime(point.timestamp)}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
