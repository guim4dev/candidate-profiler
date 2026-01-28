export function CandidateList() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
            Candidates
          </h1>
          <p className="mt-2 text-slate-600 font-body">
            Track and evaluate candidates across multiple interviews
          </p>
        </header>

        <div className="bg-white rounded-xl border border-surface-border shadow-sm">
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-medium text-slate-900 mb-2">
              No candidates yet
            </h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Add your first candidate to start tracking their interviews and evaluations.
            </p>
            <button className="btn-primary">
              Add Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
