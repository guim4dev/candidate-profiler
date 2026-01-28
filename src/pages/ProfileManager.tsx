export function ProfileManager() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
            Candidate Profiles
          </h1>
          <p className="mt-2 text-slate-600 font-body">
            Define archetypes to categorize candidates consistently
          </p>
        </header>

        <div className="bg-white rounded-xl border border-surface-border shadow-sm">
          <div className="p-6 border-b border-surface-border flex items-center justify-between">
            <h2 className="font-heading text-lg font-medium text-slate-900">
              All Profiles
            </h2>
            <button className="btn-primary text-sm">
              Add Profile
            </button>
          </div>

          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-medium text-slate-900 mb-2">
              No profiles yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Profiles will be seeded with defaults on first run (Builder, Specialist, Leader, Generalist, Learner).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
