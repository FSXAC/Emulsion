export default function RollsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Film Rolls</h2>
          <p className="text-gray-600 mt-1">
            Drag rolls between columns to update their status
          </p>
        </div>
        <button className="btn-primary">
          + Add Roll
        </button>
      </div>
      
      {/* Kanban board will go here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center py-12">
          Kanban board coming soon...
        </p>
      </div>
    </div>
  );
}
