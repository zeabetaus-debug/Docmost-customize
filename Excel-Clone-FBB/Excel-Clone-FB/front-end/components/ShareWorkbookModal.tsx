import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { ShareableUser, WorkbookListItem } from '../types';

interface ShareWorkbookModalProps {
  workbook: WorkbookListItem;
  mode: 'copy' | 'live';
  users: ShareableUser[];
  isLoadingUsers: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (recipientUserIds: string[]) => Promise<void>;
  onCancel: () => void;
}

export const ShareWorkbookModal: React.FC<ShareWorkbookModalProps> = ({
  workbook,
  mode,
  users,
  isLoadingUsers,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const visibleUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) =>
      [user.name, user.email, user.department, user.role].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [search, users]);

  const visibleUserIds = useMemo(() => visibleUsers.map((user) => user.id), [visibleUsers]);

  const selectedVisibleCount = visibleUserIds.filter((userId) =>
    selectedUserIds.includes(userId),
  ).length;

  const allVisibleSelected =
    visibleUsers.length > 0 && selectedVisibleCount === visibleUsers.length;

  const title = mode === 'copy' ? 'Share Copy' : 'Share Live Sheet';

  const subtitle =
    mode === 'copy'
      ? 'Create an independent copy for another user or manager.'
      : 'Grant real-time access to the same sheet instance.';

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((currentIds) =>
      currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId],
    );
  };

  const handleSelectAllVisible = () => {
    setSelectedUserIds((currentIds) => {
      const nextIds = new Set(currentIds);
      visibleUserIds.forEach((id) => nextIds.add(id));
      return Array.from(nextIds);
    });
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/45 p-4">

      {/* MODAL */}
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center gap-3 bg-[#107c41] px-6 py-4 text-white flex-shrink-0">
          <Icon name={mode === 'copy' ? 'CopyPlus' : 'Users'} size={22} />
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-emerald-50/90">{subtitle}</div>
          </div>
        </div>

        {/* WORKBOOK INFO */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex-shrink-0">
          <div className="text-sm font-semibold text-slate-900">{workbook.name}</div>
          <div className="mt-1 text-xs text-slate-500">
            Creator: {workbook.creatorName || 'Unknown'} | Department:{' '}
            {workbook.creatorDepartment || 'Unknown'}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">

          {/* SEARCH */}
          <label className="block flex-shrink-0">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Search recipient
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role, or department"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#107c41]"
            />
          </label>

          {/* SELECT CONTROLS */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex-shrink-0">
            <div className="text-sm text-slate-600">
              {selectedUserIds.length} recipient
              {selectedUserIds.length === 1 ? '' : 's'} selected
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={visibleUsers.length === 0 || allVisibleSelected || isSubmitting}
                onClick={handleSelectAllVisible}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-60"
              >
                Select all visible
              </button>

              <button
                type="button"
                disabled={selectedUserIds.length === 0 || isSubmitting}
                onClick={handleClearSelection}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </div>

          {/* USER LIST (SCROLLABLE) */}
          <div className="mt-4 flex-1 overflow-y-auto rounded-xl border border-slate-200">

            {isLoadingUsers ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Loading recipients...
              </div>
            ) : visibleUsers.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                No matching recipients found.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {visibleUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition ${
                      selectedUserIds.includes(user.id)
                        ? 'bg-emerald-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            selectedUserIds.includes(user.id)
                              ? 'border-[#107c41] bg-[#107c41] text-white'
                              : 'border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Icon name="Check" size={12} />
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {user.role} | {user.department}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>

                    <div className="pt-1 text-xs font-medium text-slate-400">
                      {selectedUserIds.includes(user.id) ? 'Selected' : 'Select'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-white flex-shrink-0">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            disabled={selectedUserIds.length === 0 || isSubmitting}
            onClick={() => onSubmit(selectedUserIds)}
            className="rounded-xl bg-[#107c41] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c5e31] disabled:opacity-60"
          >
            {isSubmitting ? 'Sharing...' : `${title} (${selectedUserIds.length})`}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  );
};