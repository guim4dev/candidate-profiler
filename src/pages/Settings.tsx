export function Settings() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-slate-600 font-body">
            Configure prompt templates and manage your data
          </p>
        </header>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-surface-border shadow-sm">
            <div className="p-6 border-b border-surface-border">
              <h2 className="font-heading text-lg font-medium text-slate-900">
                Data Management
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">Export Data</h3>
                  <p className="text-sm text-slate-500">Download all candidates, interviews, and profiles as JSON</p>
                </div>
                <button className="btn-secondary text-sm">
                  Export
                </button>
              </div>
              <div className="border-t border-surface-border pt-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">Import Data</h3>
                  <p className="text-sm text-slate-500">Restore data from a previously exported JSON file</p>
                </div>
                <button className="btn-secondary text-sm">
                  Import
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-surface-border shadow-sm">
            <div className="p-6 border-b border-surface-border">
              <h2 className="font-heading text-lg font-medium text-slate-900">
                AI Prompt Templates
              </h2>
            </div>
            <div className="p-6">
              <p className="text-slate-500 text-sm">
                Customize the prompts used when generating AI-ready text for interviews and candidate summaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
