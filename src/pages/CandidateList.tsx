import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidates, useInterviews, useProfiles, createCandidate, updateCandidate, deleteCandidate } from '../db/hooks';
import { CandidateModal } from '../components/CandidateModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { Candidate } from '../types';
import { HIRE_SIGNAL_LABELS, type HireSignal } from '../types';

type SortField = 'name' | 'updated_at';
type SortDirection = 'asc' | 'desc';

function HireSignalBadge({ signal }: { signal?: HireSignal }) {
  if (!signal) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        —
      </span>
    );
  }

  const styles: Record<HireSignal, string> = {
    strong_yes: 'bg-emerald-100 text-emerald-800',
    yes: 'bg-green-100 text-green-700',
    neutral: 'bg-slate-100 text-slate-600',
    no: 'bg-orange-100 text-orange-700',
    strong_no: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[signal]}`}>
      {HIRE_SIGNAL_LABELS[signal]}
    </span>
  );
}

function InterviewCountBadge({ candidateId }: { candidateId: string }) {
  const interviews = useInterviews(candidateId);
  const count = interviews.length;

  return (
    <span className="text-slate-600">
      {count} {count === 1 ? 'interview' : 'interviews'}
    </span>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ml-1 inline-block transition-colors ${active ? 'text-accent' : 'text-slate-400'}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      {direction === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      )}
    </svg>
  );
}

export function CandidateList() {
  const navigate = useNavigate();
  const candidates = useCandidates();
  const profiles = useProfiles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Build profile lookup map
  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [profiles]);

  // Get all unique tags from candidates
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    candidates.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [candidates]);

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(query));
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      result = result.filter((c) =>
        selectedTags.every((tag) => c.tags.includes(tag))
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a.updated_at.localeCompare(b.updated_at);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [candidates, searchQuery, selectedTags, sortField, sortDirection]);

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
  }, []);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  }, [sortField]);

  const handleOpenCreate = useCallback(() => {
    setEditingCandidate(undefined);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    setEditingCandidate(candidate);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCandidate(undefined);
  }, []);

  const handleSave = useCallback(async (data: { name: string; tags: string[] }) => {
    if (editingCandidate) {
      await updateCandidate(editingCandidate.id, data);
    } else {
      const id = await createCandidate(data);
      navigate(`/candidates/${id}`);
    }
  }, [editingCandidate, navigate]);

  const handleOpenDelete = useCallback((e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    setDeleteTarget(candidate);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await deleteCandidate(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const handleRowClick = useCallback((candidate: Candidate) => {
    navigate(`/candidates/${candidate.id}`);
  }, [navigate]);

  const hasCandidates = candidates.length > 0;
  const hasActiveFilters = searchQuery.trim() !== '' || selectedTags.length > 0;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-slate-900 tracking-tight">
              Candidates
            </h1>
            <p className="mt-2 text-slate-600 font-body">
              Track and evaluate candidates across multiple interviews
            </p>
          </div>
          {hasCandidates && (
            <button onClick={handleOpenCreate} className="btn-primary">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Candidate
            </button>
          )}
        </header>

        {/* Search and Filter Bar */}
        {hasCandidates && (
          <div className="mb-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              />
            </div>

            {/* Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500 font-medium">Filter by tags:</span>
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                      {isSelected && (
                        <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-slate-500 hover:text-slate-700 underline ml-2"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-surface-border shadow-sm">
          {hasCandidates ? (
            filteredCandidates.length > 0 ? (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('name')}
                          className="inline-flex items-center hover:text-slate-700 transition-colors"
                        >
                          Name
                          <SortIcon active={sortField === 'name'} direction={sortField === 'name' ? sortDirection : 'asc'} />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Tags
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Interviews
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Hire Signal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Primary Profile
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('updated_at')}
                          className="inline-flex items-center hover:text-slate-700 transition-colors"
                        >
                          Updated
                          <SortIcon active={sortField === 'updated_at'} direction={sortField === 'updated_at' ? sortDirection : 'desc'} />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredCandidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        onClick={() => handleRowClick(candidate)}
                        className="group hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{candidate.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          {candidate.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {candidate.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <InterviewCountBadge candidateId={candidate.id} />
                        </td>
                        <td className="px-6 py-4">
                          <HireSignalBadge signal={candidate.overall_hire_signal} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {candidate.primary_profile ? profileMap.get(candidate.primary_profile) ?? '—' : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(candidate.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleOpenEdit(e, candidate)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Edit candidate"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleOpenDelete(e, candidate)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete candidate"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <h3 className="font-heading text-base font-medium text-slate-900 mb-1">
                  No matching candidates
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  Try adjusting your search or filter criteria.
                </p>
                <button onClick={handleClearFilters} className="btn-secondary text-sm">
                  Clear filters
                </button>
              </div>
            )
          ) : (
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
              <button onClick={handleOpenCreate} className="btn-primary">
                Add Candidate
              </button>
            </div>
          )}
        </div>
      </div>

      <CandidateModal
        candidate={editingCandidate}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Candidate"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        warning="This will also delete all interviews associated with this candidate."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
