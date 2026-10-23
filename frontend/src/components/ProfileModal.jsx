import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Shield, CheckCircle2, Lock, Award } from 'lucide-react';
import { api } from '../api';

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  if (!isOpen || !user) return null;

  const isAdmin = user.roleName === 'ROLE_ADMIN';

  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(user.email || '');
  const [mobilePhone, setMobilePhone] = useState(user.mobilePhone || '');
  const [username, setUsername] = useState(user.username || '');
  const [newPassword, setNewPassword] = useState('');

  const [lifetimeSpending, setLifetimeSpending] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      api.getProfile(user.userId)
        .then(res => {
          if (res.data) {
            setFirstName(res.data.firstName || '');
            setLastName(res.data.lastName || '');
            setEmail(res.data.email || '');
            setMobilePhone(res.data.mobilePhone || '');
            setUsername(res.data.username || '');
            if (res.data.lifetimeSpending !== undefined) {
              setLifetimeSpending(res.data.lifetimeSpending);
            }
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);

    try {
      const payload = {
        firstName,
        lastName,
        email,
        mobilePhone,
        username: isAdmin ? username : null, // Only admin can modify username
        newPassword: newPassword ? newPassword : null,
      };

      await api.updateProfile(user.userId, payload);
      setMsg('Profile updated successfully!');
      
      onProfileUpdated({
        ...user,
        firstName,
        lastName,
        email,
        mobilePhone,
        username: isAdmin ? username : user.username,
      });

      setTimeout(() => {
        setMsg('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">User Profile</h3>
              <span className="text-xs font-semibold text-emerald-600 uppercase">
                {user.roleName}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lifetime Spending Badge for Customers (From fn_customer_lifetime_spending) */}
        {lifetimeSpending !== null && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-emerald-800">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Customer Lifetime Value:</span>
            </div>
            <span className="font-extrabold text-emerald-950 font-mono text-sm">
              Rs. {Number(lifetimeSpending).toFixed(2)}
            </span>
          </div>
        )}

        {msg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Mobile Phone</label>
            <input
              type="text"
              required
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Username Field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Username</label>
              {!isAdmin && (
                <span className="text-[10px] text-slate-400 font-medium">
                  (Assigned by admin - Locked)
                </span>
              )}
            </div>
            <input
              type="text"
              disabled={!isAdmin}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border text-slate-900 font-mono ${
                isAdmin 
                  ? 'border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500' 
                  : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Change Password */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Change Password (Leave blank to keep current)
            </label>
            <input
              type="password"
              minLength="8"
              placeholder="Enter new password (optional)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
