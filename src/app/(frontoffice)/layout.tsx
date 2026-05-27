export default function FrontofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="mx-auto max-w-lg min-h-screen bg-white shadow-sm">
        {children}
      </main>
    </div>
  )
}
