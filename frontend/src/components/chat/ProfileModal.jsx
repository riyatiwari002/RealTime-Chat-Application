import { useState, useRef } from 'react';
import { userAPI } from '../../api/api';
import toast from 'react-hot-toast';

export default function ProfileModal({ user, isOwnProfile, onClose, onBlock, onUnblock, isBlocked, onSave }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!username.trim()) return toast.error('Username cannot be empty');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', username.trim());
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await userAPI.updateProfile(formData);
      toast.success('Profile updated');
      onSave?.(data);
      setEditing(false);
      setAvatarFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setUsername(user?.username || '');
    setBio(user?.bio || '');
    setAvatarPreview(user?.avatar || '');
    setAvatarFile(null);
  };

  const handleBlock = async () => {
    try {
      if (isBlocked) {
        await userAPI.unblock(user._id);
        onUnblock(user._id);
        toast.success(`Unblocked ${user.username}`);
      } else {
        await userAPI.block(user._id);
        onBlock(user._id);
        toast.success(`Blocked ${user.username}`);
      }
      onClose();
    } catch {
      toast.error('Action failed');
    }
  };

  const displayAvatar = editing ? avatarPreview : user?.avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top banner */}
        <div className="h-20 bg-gradient-to-r from-brand-600 to-brand-800" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex justify-between items-end -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-slate-900 bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (editing ? username : user?.username)?.[0]?.toUpperCase() || '?'
                )}
              </div>
              {isOwnProfile && editing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    title="Change photo"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </>
              )}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${user?.isOnline ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
              {user?.isOnline ? '● Online' : 'Offline'}
            </span>
          </div>

          {/* Fields */}
          {isOwnProfile && editing ? (
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={150}
                  rows={3}
                  placeholder="Tell something about yourself..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-slate-500 text-right">{bio.length}/150</p>
              </div>
              {avatarFile && (
                <p className="text-xs text-brand-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  New photo selected: {avatarFile.name}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-white">{user?.username}</h2>
              <p className="text-sm text-slate-400 mb-3">{user?.email}</p>
              <p className="text-sm text-slate-300">
                {user?.bio || <span className="text-slate-500 italic">No bio yet</span>}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors">
                    Close
                  </button>
                  <button onClick={() => setEditing(true)} className="flex-1 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-sm font-medium transition-colors">
                    Edit Profile
                  </button>
                </>
              )
            ) : (
              <>
                <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors">
                  Close
                </button>
                <button
                  onClick={handleBlock}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
