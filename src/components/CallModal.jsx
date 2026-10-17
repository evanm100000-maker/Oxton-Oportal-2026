import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useCall } from '../context/CallContext';
import { Phone, Search, X, User, Shield, Volume2 } from 'lucide-react';

export default function CallModal({ isOpen, onClose }) {
  const { users, currentUser, onlineUsers } = useApp();
  const { initiateCall } = useCall();
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const validUsers = (users || [])
    .filter(u => u && u.approved && u.email !== currentUser?.email && u.role !== 'passenger');

  const filteredUsers = validUsers
    .filter(u => {
      const q = search.toLowerCase();
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const roblox = (u.robloxUsername || '').toLowerCase();
      return fullName.includes(q) || roblox.includes(q);
    })
    .sort((a, b) => {
      const aSafe = (a.email || '').replace(/\./g, ',');
      const bSafe = (b.email || '').replace(/\./g, ',');
      const aOnline = !!onlineUsers[aSafe];
      const bOnline = !!onlineUsers[bSafe];
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

  const handleCallUser = (targetUser) => {
    initiateCall(targetUser);
    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} className="glass-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.iconCircle}>
              <Phone size={18} color="#10b981" />
            </div>
            <div>
              <h3 style={styles.title}>Start Voice Call</h3>
              <p style={styles.subtitle}>Direct peer-to-peer audio calling between computers</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchWrapper}>
          <Search size={16} color="#9ca3af" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search staff to call..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={styles.searchInput}
            autoFocus
          />
        </div>

        {/* User list */}
        <div style={styles.userList}>
          {filteredUsers.length === 0 ? (
            <div style={styles.emptyState}>No staff members found matching "{search}"</div>
          ) : (
            filteredUsers.map(user => {
              const safeEmail = (user.email || '').replace(/\./g, ',');
              const isOnline = !!onlineUsers[safeEmail];

              return (
                <div key={user.email} style={styles.userRow}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatarWrapper}>
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.firstName} style={styles.avatar} />
                      ) : (
                        <div style={styles.avatarFallback}>
                          <User size={18} color="#9ca3af" />
                        </div>
                      )}
                      {isOnline && <span style={styles.onlineDot} title="Online" />}
                    </div>

                    <div style={styles.nameBlock}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={styles.userName}>{user.firstName} {user.lastName}</span>
                        {user.isAdmin && <span className="badge badge-admin" style={{ fontSize: '0.65rem' }}>Admin</span>}
                      </div>
                      <span style={styles.userRoblox}>
                        @{user.robloxUsername || 'unknown'} • {isOnline ? (
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Online</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Offline</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCallUser(user)}
                    style={{
                      ...styles.callBtn,
                      background: isOnline 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      opacity: isOnline ? 1 : 0.8
                    }}
                    title={`Call ${user.firstName}`}
                  >
                    <Phone size={14} />
                    <span>Call</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    width: '90%',
    maxWidth: '440px',
    backgroundColor: 'rgba(17, 24, 39, 0.96)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh'
  },
  header: {
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  iconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#f9fafb',
    margin: 0
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: '2px 0 0 0'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchWrapper: {
    padding: '14px 20px 8px 20px',
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '32px',
    top: '25px'
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 36px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    color: '#f3f4f6',
    fontSize: '0.88rem',
    outline: 'none'
  },
  userList: {
    padding: '10px 20px 20px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '400px'
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'background 0.15s ease'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    overflow: 'hidden'
  },
  avatarWrapper: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    flexShrink: 0
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: '2px solid #111827',
    boxShadow: '0 0 6px #10b981'
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  userName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#f3f4f6',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userRoblox: {
    fontSize: '0.75rem',
    color: '#9ca3af'
  },
  callBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0
  },
  emptyState: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '0.85rem',
    padding: '30px 10px'
  }
};
