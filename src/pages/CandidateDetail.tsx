import { useParams } from 'react-router-dom';

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <a href="/candidates" className="hover:text-accent transition-colors">Candidates</a>
            <span>/</span>
            <span className="text-slate-900">Candidate Details</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
            Candidate Details
          </h1>
          <p className="mt-2 text-slate-600 font-body">
            Viewing candidate: {id}
          </p>
        </header>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6">
              <h2 className="font-heading text-lg font-medium text-slate-900 mb-4">
                Summary
              </h2>
              <p className="text-slate-500 text-sm">
                Candidate summary and profile assignment will appear here.
              </p>
            </div>
          </div>

          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-lg font-medium text-slate-900">
                  Interview Timeline
                </h2>
                <button className="btn-primary text-sm">
                  Add Interview
                </button>
              </div>
              <p className="text-slate-500 text-sm">
                No interviews recorded yet. Add an interview to start evaluating this candidate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
