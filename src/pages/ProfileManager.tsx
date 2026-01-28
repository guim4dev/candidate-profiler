import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ProfileModal } from '../components/ProfileModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  useProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  isProfileInUse,
} from '../db/hooks';
import type { Profile } from '../types';

export function ProfileManager() {
  const profiles = useProfiles();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isInUse, setIsInUse] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = useCallback(() => {
    setEditingProfile(undefined);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((profile: Profile) => {
    setEditingProfile(profile);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async (data: { name: string; description: string }) => {
    if (editingProfile) {
      await updateProfile(editingProfile.id, data);
    } else {
      await createProfile(data);
    }
  }, [editingProfile]);

  const handleDeleteClick = useCallback(async (profile: Profile) => {
    const inUse = await isProfileInUse(profile.id);
    setIsInUse(inUse);
    setDeleteTarget(profile);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      await deleteProfile(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
    setIsInUse(false);
  }, []);

  const isEmpty = profiles.length === 0;

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
          <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
            <h2 className="font-heading text-lg font-medium text-slate-900">
              All Profiles
              {!isEmpty && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({profiles.length})
                </span>
              )}
            </h2>
            <button onClick={handleCreate} className="btn-primary text-sm">
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Add Profile
            </button>
          </div>

          {isEmpty ? (
            <EmptyState onAdd={handleCreate} />
          ) : (
            <div className="divide-y divide-surface-border">
              {profiles.map((profile) => (
                <ProfileRow
                  key={profile.id}
                  profile={profile}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        isOpen={modalOpen}
        profile={editingProfile}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Profile"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        warning={isInUse ? 'This profile is currently assigned to candidates or interviews.' : undefined}
        confirmLabel="Delete"
        variant={isInUse ? 'warning' : 'danger'}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}

function ProfileRow({
  profile,
  onEdit,
  onDelete,
}: {
  profile: Profile;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
}) {
  return (
    <div className="px-6 py-4 flex items-start gap-4 group hover:bg-slate-50 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
        <span className="font-heading text-lg font-semibold text-accent">
          {profile.name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-heading font-medium text-slate-900">
          {profile.name}
        </h3>
        {profile.description && (
          <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">
            {profile.description}
          </p>
        )}
        <p className="mt-1.5 text-xs text-slate-400">
          Updated {format(new Date(profile.updated_at), 'MMM d, yyyy')}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(profile)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Edit profile"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(profile)}
          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete profile"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
        <TagIcon className="w-8 h-8 text-accent" />
      </div>
      <h3 className="font-heading text-lg font-medium text-slate-900 mb-2">
        No profiles yet
      </h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
        Create your first profile to start categorizing candidates by archetype.
      </p>
      <button onClick={onAdd} className="btn-primary">
        <PlusIcon className="w-4 h-4 mr-1.5" />
        Create Profile
      </button>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}
