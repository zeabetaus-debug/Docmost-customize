import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { WorkbookListItem } from '../types';

interface OpenModalProps {
  files: WorkbookListItem[];
  onOpen: (file: WorkbookListItem) => void;
  onDelete: (file: WorkbookListItem) => Promise<void>;
  onDownload: (file: WorkbookListItem) => Promise<void>;
  onShareCopy: (file: WorkbookListItem) => void;
  onShareLive: (file: WorkbookListItem) => void;
  onCancel: () => void;
}

export const OpenModal: React.FC<OpenModalProps> = ({
  files,
  onOpen,
  onDelete,
  onDownload,
  onShareCopy,
  onShareLive,
  onCancel,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [sheetNameFilter, setSheetNameFilter] = useState('');
  const [creatorNameFilter, setCreatorNameFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const departmentOptions = useMemo(
    () =>
      [...new Set(files.map((file) => file.creatorDepartment).filter((value): value is string => Boolean(value)))].sort(),
    [files],
  );

  const visibleFiles = useMemo(() => {
    const normalizedSheetName = sheetNameFilter.trim().toLowerCase();
    const normalizedCreatorName = creatorNameFilter.trim().toLowerCase();

    return files.filter((file) => {
      const matchesDepartment =
        !departmentFilter || file.creatorDepartment === departmentFilter;

      const matchesSheetName =
        !normalizedSheetName ||
        (file.name || '').toLowerCase().includes(normalizedSheetName);

      const matchesCreatorName =
        !normalizedCreatorName ||
        (file.creatorName || '').toLowerCase().includes(normalizedCreatorName);

      return matchesDepartment && matchesSheetName && matchesCreatorName;
    });
  }, [creatorNameFilter, departmentFilter, files, sheetNameFilter]);

  const handleDelete = async (file: WorkbookListItem) => {
    if (!window.confirm('Are you sure you want to delete this sheet?')) return;

    setIsDeleting(true);

    try {
      await onDelete(file);
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[500] flex items-center justify-center p-4">
      
      {/* MODAL */}
      <div className="bg-white shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="bg-[#107c41] text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <Icon name="FolderOpen" size={22} />
          <span className="font-semibold text-xl">View Sheets</span>
        </div>

        {/* FILTERS */}
        <div className="border-b border-gray-200 bg-gray-50 p-4 flex-shrink-0">
          <div className="grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Department
              </span>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#107c41]"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Sheet Name
              </span>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#107c41]"
                value={sheetNameFilter}
                onChange={(e) => setSheetNameFilter(e.target.value)}
                placeholder="Search by sheet name"
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Creator Name
              </span>
              <input
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#107c41]"
                value={creatorNameFilter}
                onChange={(e) => setCreatorNameFilter(e.target.value)}
                placeholder="Search by creator"
              />
            </label>
          </div>
        </div>

        {/* TABLE AREA (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6">

          {visibleFiles.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No sheets match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                    <th className="px-4 py-3">Sheet</th>
                    <th className="px-4 py-3">Creator</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Access</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {visibleFiles.map((file) => (
                    <tr key={file.id} className="text-sm text-gray-700">
                      
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {file.name || 'Unnamed Sheet'}
                      </td>

                      <td className="px-4 py-4">
                        {file.creatorName || 'Unknown'}
                      </td>

                      <td className="px-4 py-4">
                        {file.creatorDepartment || 'Unknown'}
                      </td>

                      <td className="px-4 py-4">
                        {file.accessType}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">

                          <button
                            onClick={() => onOpen(file)}
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 px-3 py-1.5 text-xs font-medium text-[#107c41] hover:bg-emerald-50"
                          >
                            <Icon name="FolderOpen" size={14} />
                            Open
                          </button>

                          <button
                            onClick={() => void onDownload(file)}
                            className="inline-flex items-center gap-1 rounded border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                          >
                            <Icon name="Download" size={14} />
                            Download
                          </button>

                          {file.canShare && (
                            <>
                              <button
                                onClick={() => onShareCopy(file)}
                                className="inline-flex items-center gap-1 rounded border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-50"
                              >
                                <Icon name="CopyPlus" size={14} />
                                Share Copy
                              </button>

                              <button
                                onClick={() => onShareLive(file)}
                                className="inline-flex items-center gap-1 rounded border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
                              >
                                <Icon name="Users" size={14} />
                                Share Live
                              </button>
                            </>
                          )}

                          <button
                            disabled={isDeleting}
                            onClick={() => handleDelete(file)}
                            className="inline-flex items-center gap-1 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            <Icon name="Trash2" size={14} />
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

      </div>

    </div>,
    document.body,
  );
};