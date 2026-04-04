import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { Department, ManagedUser, UpdateUserFormData, UserRole } from '../types';

interface EditUserModalProps {
  currentUserRole: UserRole;
  user: ManagedUser;
  onSubmit: (formData: UpdateUserFormData) => Promise<void>;
  onCancel: () => void;
}

const departmentOptions: Department[] = ['Zea Us', 'Zea India', 'Zea Lead-Gen', 'Admin'];
const roleOptions: UserRole[] = ['Admin', 'Manager', 'User'];
const phoneNumberPattern = /^\+?[0-9()\-\s]{7,20}$/;

export const EditUserModal: React.FC<EditUserModalProps> = ({
  currentUserRole,
  user,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<UpdateUserFormData>({
    name: user.name,
    employeeId: user.employeeId,
    phoneNumber: user.phoneNumber,
    managerName: user.managerName,
    department: user.department as Department,
    email: user.email,
    password: '',
    role: user.role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const canEditName = true;
  const canEditPhoneNumber = true;
  const canEditEmail = currentUserRole === 'Admin' || currentUserRole === 'Manager';
  const canEditPassword = currentUserRole === 'Admin' || currentUserRole === 'Manager';
  const canEditDepartment = currentUserRole === 'Admin' || currentUserRole === 'Manager';
  const canEditEmployeeId = currentUserRole === 'Admin' || currentUserRole === 'Manager';
  const canEditRole = currentUserRole === 'Admin';
  const canEditManagerName = currentUserRole === 'Admin' && formData.role === 'User';
  const showManagerName = formData.role === 'User';

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const updateField = <T extends keyof UpdateUserFormData>(field: T, value: UpdateUserFormData[T]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const getInputClassName = (disabled: boolean) =>
    `w-full rounded border px-3 py-2 outline-none transition focus:border-[#107c41] ${
      disabled
        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
        : 'border-gray-300 bg-white text-gray-900'
    }`;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedName = formData.name.trim();
    const normalizedPhoneNumber = formData.phoneNumber.trim();
    const normalizedManagerName = formData.managerName.trim();

    if (!normalizedName) {
      setError('Name is required.');
      return;
    }

    if (!phoneNumberPattern.test(normalizedPhoneNumber)) {
      setError('Phone number format is invalid.');
      return;
    }

    if (showManagerName && !normalizedManagerName) {
      setError('Manager Name is required when the user role is User.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        name: normalizedName,
        employeeId: formData.employeeId.trim(),
        phoneNumber: normalizedPhoneNumber,
        managerName: normalizedManagerName,
        email: formData.email.trim(),
        password: formData.password.trim(),
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to update user.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-[#107c41] px-6 py-4 text-white">
          <Icon name="UserPen" size={22} />
          <div>
            <div className="text-lg font-semibold">Update User</div>
            <div className="text-sm text-emerald-50/90">Edit user details based on your role permissions</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Name</span>
              <input
                ref={firstInputRef}
                className={getInputClassName(!canEditName)}
                value={formData.name}
                onChange={(event) => updateField('name', event.target.value)}
                disabled={!canEditName || isSubmitting}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Employee ID</span>
              <input
                className={getInputClassName(!canEditEmployeeId)}
                value={formData.employeeId}
                onChange={(event) => updateField('employeeId', event.target.value)}
                disabled={!canEditEmployeeId || isSubmitting}
                required={canEditEmployeeId}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Phone Number</span>
              <input
                className={getInputClassName(!canEditPhoneNumber)}
                value={formData.phoneNumber}
                onChange={(event) => updateField('phoneNumber', event.target.value)}
                disabled={!canEditPhoneNumber || isSubmitting}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                className={getInputClassName(!canEditEmail)}
                value={formData.email}
                onChange={(event) => updateField('email', event.target.value)}
                disabled={!canEditEmail || isSubmitting}
                required={canEditEmail}
              />
            </label>

            {showManagerName ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Manager Name</span>
                <input
                  className={getInputClassName(!canEditManagerName)}
                  value={formData.managerName}
                  onChange={(event) => updateField('managerName', event.target.value)}
                  disabled={!canEditManagerName || isSubmitting}
                  required={canEditManagerName}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Department</span>
              <select
                className={getInputClassName(!canEditDepartment)}
                value={formData.department}
                onChange={(event) => updateField('department', event.target.value as Department)}
                disabled={!canEditDepartment || isSubmitting}
              >
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Password</span>
              <input
                type="password"
                className={getInputClassName(!canEditPassword)}
                value={formData.password}
                onChange={(event) => updateField('password', event.target.value)}
                disabled={!canEditPassword || isSubmitting}
                placeholder={canEditPassword ? 'Leave blank to keep current password' : ''}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Role</span>
              <select
                className={getInputClassName(!canEditRole)}
                value={formData.role}
                onChange={(event) => updateField('role', event.target.value as UserRole)}
                disabled={!canEditRole || isSubmitting}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-[#107c41] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c5e31] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
