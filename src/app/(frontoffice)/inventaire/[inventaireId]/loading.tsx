export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen animate-pulse">
      <div className="h-2 bg-gray-200 w-full" />
      <div className="flex-1 p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-200 rounded-xl" />
          <div className="h-20 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
