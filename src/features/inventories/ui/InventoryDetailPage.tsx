'use client'

import type { InventoryWithCompartments } from '../domain/types'
import { useInventoryDetailPage } from './hooks/useInventoryDetailPage'
import { useQrCodeModal } from './hooks/useQrCodeModal'
import { InventoryDetail } from './InventoryDetail'
import { QrCodeModal } from './QrCodeModal'

interface InventoryDetailPageProps {
  inventory: InventoryWithCompartments
}

export function InventoryDetailPage({ inventory }: InventoryDetailPageProps) {
  const {
    isPending, error,
    handleRenameInventory, handleDeleteInventory,
    handleAddCompartment, handleRenameCompartment, handleDeleteCompartment, handleReorderCompartments,
    handleAddItem, handleEditItem, handleDeleteItem, handleReorderItems,
  } = useInventoryDetailPage(inventory)

  const qr = useQrCodeModal(inventory.id)

  return (
    <div>
      {error && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}
      {isPending && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none">
          Enregistrement…
        </div>
      )}
      <InventoryDetail
        inventory={inventory}
        onShowQrCode={qr.open}
        onRenameInventory={handleRenameInventory}
        onDeleteInventory={handleDeleteInventory}
        onAddCompartment={handleAddCompartment}
        onRenameCompartment={handleRenameCompartment}
        onDeleteCompartment={handleDeleteCompartment}
        onReorderCompartments={handleReorderCompartments}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onReorderItems={handleReorderItems}
      />
      <QrCodeModal
        isOpen={qr.isOpen}
        inventoryName={inventory.name}
        inventoryUrl={qr.inventoryUrl}
        qrDataUrl={qr.qrDataUrl}
        copied={qr.copied}
        error={qr.error}
        onCopy={qr.handleCopy}
        onPrint={qr.handlePrint}
        onClose={qr.close}
      />
    </div>
  )
}
