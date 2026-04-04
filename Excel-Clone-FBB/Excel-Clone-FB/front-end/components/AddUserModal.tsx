import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { AccountStatus, CreateUserFormData, Department, UserRole } from '../types';

interface AddUserModalProps {
  creatorRole: UserRole;
  onSubmit: (formData: CreateUserFormData) => Promise<void>;
  onCancel: () => void;
}

const accountStatusOptions: AccountStatus[] = ['Active', 'Inactive'];

const departmentOptions: Department[] = [
  'Zea Us',
  'Zea India',
  'Zea Lead-Gen',
  'Admin',
];

const roleOptionsByCreator: Record<UserRole, UserRole[]> = {
  Admin: ['Admin', 'Manager', 'User'],
  Manager: ['User'],
  User: [],
};

type AddUserFormState = Omit<CreateUserFormData, 'department' | 'role' | 'accountStatus'> & {
  department: Department | '';
  role: UserRole | '';
  accountStatus: AccountStatus | '';
};

export const AddUserModal: React.FC<AddUserModalProps> = ({
  creatorRole,
  onSubmit,
  onCancel,
}) => {
  const availableRoles = roleOptionsByCreator[creatorRole];
  const [formData, setFormData] = useState<AddUserFormState>({
    name: '',
    employeeId: '',
    phoneNumber: '',
    managerName: '',
    department: '',
    email: '',
    password: '',
    role: '',
    accountStatus: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const isAdminRole = formData.role === 'Admin';

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const updateField = <T extends keyof AddUserFormState>(
    field: T,
    value: AddUserFormState[T]
  ) => {
    setFormData((current) => {
      if (field === 'role') {
        return {
          ...current,
          role: value as UserRole,
          department:
            value === 'Admin'
              ? 'Admin'
              : current.department === 'Admin'
              ? ''
              : current.department,
        };
      }

      return { ...current, [field]: value };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.role) {
      setError('Please select a role.');
      setIsSubmitting(false);
      return;
    }

    if (!formData.accountStatus) {
      setError('Please select an account status.');
      setIsSubmitting(false);
      return;
    }

    const role = formData.role;
    const accountStatus = formData.accountStatus;
    const department = role === 'Admin' ? 'Admin' : formData.department;
    if (!department) {
      setError('Please select a department.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        employeeId: formData.employeeId.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        managerName: formData.managerName.trim(),
        email: formData.email.trim(),
        role,
        accountStatus,
        department,
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Failed to add user.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-[#107c41] px-6 py-4 text-white">
          <Icon name="UserPlus" size={22} />
          <div>
            <div className="text-lg font-semibold">Add User</div>
            <div className="text-sm text-emerald-50/90">
              Create a new company account
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6" autoComplete="off">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </span>
              <input
                ref={firstInputRef}
                name="new-user-name"
                autoComplete="off"
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Employee ID
              </span>
              <input
                name="new-user-employee-id"
                autoComplete="off"
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.employeeId}
                onChange={(e) => updateField('employeeId', e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number
              </span>
              <input
                name="new-user-phone"
                autoComplete="off"
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Manager Name
              </span>
              <input
                name="new-user-manager"
                autoComplete="off"
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.managerName}
                onChange={(e) => updateField('managerName', e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </span>
              <input
                type="email"
                name="new-user-email"
                autoComplete="off"
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Department
              </span>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.department}
                onChange={(e) =>
                  updateField('department', e.target.value as Department | '')
                }
                required={!isAdminRole}
                disabled={isAdminRole}
              >
                <option value="" disabled>
                  Select department
                </option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </span>
              <input
                type="password"
                name="new-user-password"
                autoComplete="new-password"
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </span>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.role}
                onChange={(e) =>
                  updateField('role', e.target.value as UserRole)
                }
                required
              >
                <option value="" disabled>
                  Select role
                </option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Account Status
              </span>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#107c41]"
                value={formData.accountStatus}
                onChange={(e) =>
                  updateField('accountStatus', e.target.value as AccountStatus)
                }
                required
              >
                <option value="" disabled>
                  Select account status
                </option>
                {accountStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-[#107c41] px-4 py-2 text-sm text-white hover:bg-[#0c5e31] disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

