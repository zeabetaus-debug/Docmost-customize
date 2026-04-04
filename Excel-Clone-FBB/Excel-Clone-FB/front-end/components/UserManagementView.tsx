import React, { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { AccountStatus, ManagedUser, UserRole } from '../types';

interface UserManagementViewProps {
  currentUserRole: UserRole;
  users: ManagedUser[];
  isLoading: boolean;
  error: string | null;
  isRefreshingStatusId: string | null;
  isDeletingUserId: string | null;
  isUpdatingUserId: string | null;
  onRefresh: () => void;
  onToggleStatus: (user: ManagedUser) => void;
  onDeleteUser: (user: ManagedUser) => void;
  onOpenUpdateUser: (user: ManagedUser) => void;
  onOpenAddUser: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUserRole,
  users,
  isLoading,
  error,
  isRefreshingStatusId,
  isDeletingUserId,
  isUpdatingUserId,
  onRefresh,
  onToggleStatus,
  onDeleteUser,
  onOpenUpdateUser,
  onOpenAddUser,
}) => {
  const canAddUsers = currentUserRole === 'Admin' || currentUserRole === 'Manager';
  const [nameFilter, setNameFilter] = useState('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const departmentOptions = useMemo(
    () => [...new Set(users.map((user) => user.department).filter(Boolean))].sort(),
    [users],
  );

  const visibleUsers = useMemo(() => {
    const normalizedName = nameFilter.trim().toLowerCase();
    const normalizedEmployeeId = employeeIdFilter.trim().toLowerCase();

    return users.filter((user) => {
      const matchesName = !normalizedName || user.name.toLowerCase().includes(normalizedName);
      const matchesEmployeeId = !normalizedEmployeeId || user.employeeId.toLowerCase().includes(normalizedEmployeeId);
      const matchesDepartment = !departmentFilter || user.department === departmentFilter;
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || user.accountStatus === statusFilter;

      return matchesName && matchesEmployeeId && matchesDepartment && matchesRole && matchesStatus;
    });
  }, [departmentFilter, employeeIdFilter, nameFilter, roleFilter, statusFilter, users]);

  const filterSelectClassName =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#107c41]';
  const filterInputClassName =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#107c41]';

  return (
    <div className="flex-1 overflow-auto bg-[linear-gradient(180deg,#f7fbf8_0%,#eef5f1_100%)] px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_24px_60px_rgba(16,124,65,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#107c41]">
                  <Icon name="Users" size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">User Management</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Review account access and manage active or inactive status by role.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Icon name="RefreshCw" size={16} />
                <span>Refresh</span>
              </button>

              {canAddUsers && (
                <button
                  type="button"
                  onClick={onOpenAddUser}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#107c41] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c5e31]"
                >
                  <Icon name="UserPlus" size={16} />
                  <span>Add User</span>
                </button>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Name
                </span>
                <input
                  value={nameFilter}
                  onChange={(event) => setNameFilter(event.target.value)}
                  placeholder="Search by name"
                  className={filterInputClassName}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Employee ID
                </span>
                <input
                  value={employeeIdFilter}
                  onChange={(event) => setEmployeeIdFilter(event.target.value)}
                  placeholder="Search by employee ID"
                  className={filterInputClassName}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Department
                </span>
                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className={filterSelectClassName}
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Role
                </span>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className={filterSelectClassName}
                >
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="User">User</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Account Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as AccountStatus | '')}
                  className={filterSelectClassName}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Employee ID</th>
                    <th className="px-4 py-4">Department</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4">Email</th>
                    <th className="px-4 py-4">Phone Number</th>
                    <th className="px-4 py-4">Account Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : visibleUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    visibleUsers.map((user) => {
                      const nextStatus = user.accountStatus === 'Active' ? 'Inactive' : 'Active';
                      const isUpdating = isRefreshingStatusId === user.id;
                      const isDeleting = isDeletingUserId === user.id;
                      const isSavingUpdate = isUpdatingUserId === user.id;

                      return (
                        <tr key={user.id} className="text-sm text-slate-700">
                          <td className="px-4 py-4 font-medium text-slate-900">{user.name}</td>
                          <td className="px-4 py-4">{user.employeeId}</td>
                          <td className="px-4 py-4">{user.department}</td>
                          <td className="px-4 py-4">{user.role}</td>
                          <td className="px-4 py-4">{user.email}</td>
                          <td className="px-4 py-4">{user.phoneNumber}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                user.accountStatus === 'Active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {user.accountStatus}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {user.canUpdateUser ? (
                                <button
                                  type="button"
                                  disabled={isSavingUpdate}
                                  onClick={() => onOpenUpdateUser(user)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Icon name="UserPen" size={14} />
                                  <span>{isSavingUpdate ? 'Updating...' : 'Update User'}</span>
                                </button>
                              ) : null}

                              {user.canManageStatus ? (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => onToggleStatus(user)}
                                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                    user.accountStatus === 'Active'
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  <Icon name={user.accountStatus === 'Active' ? 'UserX' : 'UserCheck'} size={14} />
                                  <span>{isUpdating ? 'Updating...' : nextStatus === 'Active' ? 'Activate' : 'Deactivate'}</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center rounded-xl px-3 py-2 text-xs font-medium text-slate-400">
                                  View only
                                </span>
                              )}

                              {user.canDeleteUser ? (
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => onDeleteUser(user)}
                                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Icon name="Trash2" size={14} />
                                  <span>{isDeleting ? 'Deleting...' : 'Delete User'}</span>
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
