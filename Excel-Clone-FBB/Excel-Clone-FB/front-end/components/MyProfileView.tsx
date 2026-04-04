import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { MyProfileData, UpdateMyProfileFormData } from '../types';

interface MyProfileViewProps {
  profile: MyProfileData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  onRefresh: () => void;
  onSubmit: (formData: UpdateMyProfileFormData) => Promise<void>;
}

const phoneNumberPattern = /^\+?[0-9()\-\s]{7,20}$/;

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  profile,
  isLoading,
  isSaving,
  error,
  onRefresh,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateMyProfileFormData>({
    name: '',
    employeeId: '',
    phoneNumber: '',
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormData({
      name: profile.name,
      employeeId: profile.employeeId,
      phoneNumber: profile.phoneNumber,
    });
    setSubmitError(null);
  }, [profile]);

  const readOnlyInputClassName =
    'w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-500 outline-none';
  const editableInputClassName =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#107c41]';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const normalizedName = formData.name.trim();
    const normalizedEmployeeId = formData.employeeId.trim();
    const normalizedPhoneNumber = formData.phoneNumber.trim();

    if (!normalizedName) {
      setSubmitError('Name is required.');
      return;
    }

    if (!normalizedEmployeeId) {
      setSubmitError('Employee ID is required.');
      return;
    }

    if (!phoneNumberPattern.test(normalizedPhoneNumber)) {
      setSubmitError('Phone number format is invalid.');
      return;
    }

    await onSubmit({
      name: normalizedName,
      employeeId: normalizedEmployeeId,
      phoneNumber: normalizedPhoneNumber,
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-[linear-gradient(180deg,#f7fbf8_0%,#eef5f1_100%)] px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[28px] border border-emerald-100 bg-white/95 p-6 shadow-[0_24px_60px_rgba(16,124,65,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#107c41]">
                <Icon name="UserRound" size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">My Profile</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Update your basic profile details. Email, role, department, and status are read-only here.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon name="RefreshCw" size={16} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {submitError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          {isLoading && !profile ? (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Loading your profile...
            </div>
          ) : profile ? (
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
                  <input
                    className={editableInputClassName}
                    value={formData.name}
                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Mobile Number</span>
                  <input
                    className={editableInputClassName}
                    value={formData.phoneNumber}
                    onChange={(event) => setFormData((current) => ({ ...current, phoneNumber: event.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Employee ID</span>
                  <input
                    className={editableInputClassName}
                    value={formData.employeeId}
                    onChange={(event) => setFormData((current) => ({ ...current, employeeId: event.target.value }))}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                  <div className="relative">
                    <input className={readOnlyInputClassName} value={profile.email} disabled readOnly />
                    <Icon name="Lock" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Role</span>
                  <div className="relative">
                    <input className={readOnlyInputClassName} value={profile.role} disabled readOnly />
                    <Icon name="Lock" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Department</span>
                  <div className="relative">
                    <input className={readOnlyInputClassName} value={profile.department} disabled readOnly />
                    <Icon name="Lock" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Account Status</span>
                  <div className="relative">
                    <input className={readOnlyInputClassName} value={profile.accountStatus} disabled readOnly />
                    <Icon name="Lock" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Manager Name</span>
                  <div className="relative">
                    <input className={readOnlyInputClassName} value={profile.managerName || '-'} disabled readOnly />
                    <Icon name="Lock" size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </label>
              </div>

              <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
                <button
                  type="submit"
                  disabled={isSaving || isLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#107c41] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c5e31] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon name="Save" size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Profile details are not available right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
