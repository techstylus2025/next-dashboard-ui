export default function ThemePreview() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Theme Preview</h2>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Card</h3>
            <p className="text-sm text-slate-700">This card shows background, border and text colors.</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary">Primary</button>
              <button className="btn-secondary">Secondary</button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Table</h3>
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody className="table-body">
                <tr><td>Alice</td><td>Teacher</td></tr>
                <tr><td>Bob</td><td>Student</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
