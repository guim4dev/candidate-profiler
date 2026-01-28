import { useState, useEffect, useRef } from 'react';
import type { Profile } from '../types';

interface ProfileModalProps {
  profile?: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => Promise<void>;
}

export function ProfileModal({ profile, isOpen, onClose, onSave }: ProfileModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(profile?.name ?? '');
      setDescription(profile?.description ?? '');
      setError('');
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');
    
    try {
      await onSave({ name: trimmedName, description: description.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isEdit = !!profile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-surface-border">
          <h2 className="font-heading text-xl font-semibold text-slate-900">
            {isEdit ? 'Edit Profile' : 'Create Profile'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit ? 'Update the profile archetype' : 'Define a new candidate archetype'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Builder, Specialist"
                className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="profile-description" className="block text-sm font-medium text-slate-700 mb-1.5">
                Description
              </label>
              <textarea
                id="profile-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what makes this archetype unique..."
                rows={3}
                className="w-full rounded-lg border-surface-border focus:border-accent focus:ring-accent resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-surface-border flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : isEdit ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
