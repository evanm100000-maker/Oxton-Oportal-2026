import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useCall } from '../context/CallContext';
import { Send, ShieldAlert, Users, MessageSquare, Globe, Reply, Trash2, Flag, Smile, X, Image as ImageIcon, Paperclip, Plus, Phone, PhoneCall, UserPlus, LogOut } from 'lucide-react';
import { storage } from "../firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// Helper to robustly parse timestamps into reader's local Date object
export const parseMessageDate = (timestamp) => {
  if (!timestamp) return new Date();
  if (typeof timestamp === 'number') return new Date(timestamp);
  if (typeof timestamp === 'string') {
    let str = timestamp.trim();
    if (/^\d+$/.test(str)) return new Date(Number(str));
    // If ISO datetime format without timezone offset or Z, append Z so it parses as UTC
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  const fallback = new Date(timestamp);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
};

// Formats message timestamp into the local time of the user reading it
export const formatMessageLocalTime = (timestamp, use24h = false) => {
  const date = parseMessageDate(timestamp);
  try {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24h
    });
  } catch (e) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

export default function StaffChat() {
  const { 
    currentUser, 
    chatMessages, 
    addChatMessage, 
    deleteChatMessage, 
    addMessageReaction, 
    submitReport, 
    setCustomRole, 
    users, 
    use24HourClock,
    groupChats = [],
    createGroupChat,
    addGroupMember,
    leaveGroupChat,
    deleteGroupChat
  } = useApp();
  const { initiateCall, initiateGroupCall, activeGroupCalls, joinCall } = useCall();
  const [activeChannel, setActiveChannel] = useState('Staff Chat');
  const [inputText, setInputText] = useState('');
  const [rolePromptTarget, setRolePromptTarget] = useState(null);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState('');
  const messagesEndRef = useRef(null);

  const safeChatMessages = Array.isArray(chatMessages) ? chatMessages : [];

  // Sort chronologically: oldest at top, newest at bottom (normal chat behavior)
  const filteredMessages = React.useMemo(() => {
    return safeChatMessages
      .filter(m => m && m.channel === activeChannel)
      .sort((a, b) => {
        const timeA = parseMessageDate(a.timestamp).getTime();
        const timeB = parseMessageDate(b.timestamp).getTime();
        return timeA - timeB;
      });
  }, [safeChatMessages, activeChannel]);

  // Scroll to the newest messages at the bottom when opening a channel or when new messages arrive
  useEffect(() => {
    const scrollToBottom = (behavior = 'auto') => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    };
    scrollToBottom('auto');
    const timer = setTimeout(() => scrollToBottom('auto'), 120);
    return () => clearTimeout(timer);
  }, [activeChannel, filteredMessages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;
    
    let replyData = null;
    if (replyingTo) {
      replyData = {
        id: replyingTo.id,
        senderName: replyingTo.senderName || 'Unknown',
        text: (replyingTo.text || '').length > 50 ? replyingTo.text.substring(0, 50) + '...' : (replyingTo.text || '')
      };
    }

    let attachmentUrl = null;
    if (attachment) {
      setIsUploading(true);
      try {
        const fileRef = storageRef(storage, `chat_attachments/${Date.now()}_${attachment.name}`);
        const snapshot = await uploadBytes(fileRef, attachment);
        attachmentUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload image. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }
    
    addChatMessage(activeChannel, inputText.trim(), replyData, attachmentUrl);
    setInputText('');
    setReplyingTo(null);
    setAttachment(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File size exceeds 5MB limit.");
        return;
      }
      setAttachment(file);
    }
  };

  const handleReport = (msg) => {
    if (window.confirm(`Are you sure you want to report this message by ${msg.senderName || 'Unknown'}?`)) {
      submitReport({
        type: 'Chat Message Report',
        reportedPlayer: msg.senderName || 'Unknown',
        description: `Reported Message ID: ${msg.id}\nMessage Content: "${msg.text}"\nChannel: ${msg.channel}`,
        evidenceLink: ''
      });
      alert('Message reported successfully. It has been sent to the admin panel.');
    }
  };

  const handleSetRole = (e) => {
    e.preventDefault();
    if (!rolePromptTarget) return;
    setCustomRole(rolePromptTarget.email, newRoleInput);
    setRolePromptTarget(null);
    setNewRoleInput('');
  };



  const getGroupMembers = (g) => {
    if (!g || !g.members) return [];
    if (Array.isArray(g.members)) return g.members.filter(Boolean);
    if (typeof g.members === 'object') return Object.values(g.members).filter(Boolean);
    return [];
  };

  const myEmail = (currentUser?.email || '').toLowerCase().trim();
  const myGroups = (groupChats || []).filter(g => {
    if (!g) return false;
    const members = getGroupMembers(g).map(e => (e || '').toLowerCase().trim());
    return members.includes(myEmail) || !!currentUser?.isAdmin;
  });

  const currentGroup = activeChannel.startsWith('group_')
    ? (groupChats || []).find(g => g.id === activeChannel.replace('group_', ''))
    : null;

  const getChannelName = () => {
    if (['Staff Chat', 'Security', 'Global'].includes(activeChannel)) {
      return `# ${activeChannel.toLowerCase().replace(' ', '-')}`;
    }
    if (currentGroup) {
      return `# ${currentGroup.name}`;
    }
    return '# unknown';
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const group = await createGroupChat(newGroupName.trim(), selectedGroupMembers);
    if (group) {
      setActiveChannel(`group_${group.id}`);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setSelectedGroupMembers([]);
      setGroupMemberSearch('');
    }
  };

  const handleCallCurrentGroup = () => {
    if (!currentGroup) return;
    const otherMembers = getGroupMembers(currentGroup).filter(e => (e || '').toLowerCase().trim() !== myEmail);
    if (otherMembers.length === 0) {
      alert("There are no other members in this group to call.");
      return;
    }
    initiateGroupCall(`Group Call • ${currentGroup.name}`, otherMembers, null, currentGroup.id);
  };

  const handleAddMemberToCurrentGroup = async (e) => {
    e.preventDefault();
    if (!currentGroup || !memberToAdd) return;
    await addGroupMember(currentGroup.id, memberToAdd);
    setShowAddMemberModal(false);
    setMemberToAdd('');
  };

  return (
    <div className="admin-layout" style={styles.container}>
      {/* Channels Sidebar */}
      <div style={styles.sidebar} className="glass-panel admin-sidebar">
        <h3 style={styles.sidebarTitle}><MessageSquare size={16} /> Public Channels</h3>
        <button 
          onClick={() => setActiveChannel('Staff Chat')}
          style={{
            ...styles.channelBtn,
            background: activeChannel === 'Staff Chat' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            borderColor: activeChannel === 'Staff Chat' ? '#3b82f6' : 'transparent',
            color: activeChannel === 'Staff Chat' ? 'var(--color-text-main)' : '#9ca3af'
          }}
        >
          <Users size={16} /> # staff-chat
        </button>
        <button 
          onClick={() => setActiveChannel('Security')}
          style={{
            ...styles.channelBtn,
            background: activeChannel === 'Security' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            borderColor: activeChannel === 'Security' ? '#ef4444' : 'transparent',
            color: activeChannel === 'Security' ? 'var(--color-text-main)' : '#9ca3af'
          }}
        >
          <ShieldAlert size={16} /> # security
        </button>
        <button 
          onClick={() => setActiveChannel('Global')}
          style={{
            ...styles.channelBtn,
            background: activeChannel === 'Global' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            borderColor: activeChannel === 'Global' ? '#10b981' : 'transparent',
            color: activeChannel === 'Global' ? 'var(--color-text-main)' : '#9ca3af'
          }}
        >
          <Globe size={16} /> Global
        </button>

        {/* Group Chats Section */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '4px' }}>
          <h3 style={{ ...styles.sidebarTitle, marginBottom: 0 }}>
            <Users size={16} /> Group Chats
          </h3>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Create New Group Chat"
          >
            <Plus size={12} /> New
          </button>
        </div>

        {myGroups.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: '#6b7280', padding: '8px 12px', fontStyle: 'italic' }}>
            No group chats yet. Click "+ New" to create one.
          </div>
        ) : (
          myGroups.map(group => {
            const isGroupActive = activeChannel === `group_${group.id}`;
            const memberCount = getGroupMembers(group).length;
            return (
              <button
                key={group.id}
                onClick={() => setActiveChannel(`group_${group.id}`)}
                style={{
                  ...styles.channelBtn,
                  width: '100%',
                  background: isGroupActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isGroupActive ? '#8b5cf6' : 'rgba(255, 255, 255, 0.06)',
                  color: isGroupActive ? 'var(--color-text-main)' : '#9ca3af',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  boxShadow: isGroupActive ? '0 2px 10px rgba(139, 92, 246, 0.25)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <Users size={15} color={isGroupActive ? '#a78bfa' : '#9ca3af'} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</span>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '10px', background: isGroupActive ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255,255,255,0.08)', color: isGroupActive ? '#e9d5ff' : '#9ca3af', fontWeight: '600' }}>
                  {memberCount}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Main Chat Area */}
      <div style={styles.chatArea} className="glass-panel">
        <div style={{ ...styles.chatHeader, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.channelName}>{getChannelName()}</h2>
            <span style={styles.channelDesc}>
              {activeChannel === 'Security' ? 'Restricted security operations channel.' : 
               activeChannel === 'Staff Chat' ? 'General staff communication channel.' : 
               activeChannel === 'Global' ? 'Global announcements channel.' : 
               currentGroup ? `Group chat • ${currentGroup.members?.length || 0} members` : ''}
            </span>
          </div>

          {/* Group Call & Actions Header if current channel is a Group */}
          {currentGroup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(() => {
                const activeGroupCall = (activeGroupCalls || []).find(c => 
                  c.groupId === currentGroup.id || 
                  (c.groupTitle && currentGroup.name && c.groupTitle.toLowerCase().includes(currentGroup.name.toLowerCase()))
                );

                if (activeGroupCall) {
                  return (
                    <button
                      onClick={() => joinCall(activeGroupCall)}
                      className="btn-success"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
                        animation: 'pulse 2s infinite'
                      }}
                      title="Join ongoing group call"
                    >
                      <PhoneCall size={15} />
                      <span>Join Call</span>
                    </button>
                  );
                }

                return (
                  <button
                    onClick={handleCallCurrentGroup}
                    className="btn-success"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}
                    title="Call all group members"
                  >
                    <PhoneCall size={15} />
                    <span>Call Group</span>
                  </button>
                );
              })()}

              <button
                onClick={() => setShowAddMemberModal(true)}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
                title="Add member to group"
              >
                <UserPlus size={15} />
                <span>Add</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm(`Leave group "${currentGroup.name}"?`)) {
                    leaveGroupChat(currentGroup.id);
                    setActiveChannel('Staff Chat');
                  }
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                title="Leave Group"
              >
                <LogOut size={15} />
              </button>

              {(currentUser?.isAdmin || (currentGroup.createdBy && currentGroup.createdBy.toLowerCase() === myEmail)) && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete group "${currentGroup.name}" permanently for everyone?`)) {
                      deleteGroupChat(currentGroup.id);
                      setActiveChannel('Staff Chat');
                    }
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Delete Group (Admin / Creator)"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        <div style={styles.messageList}>
          {filteredMessages.length === 0 ? (
            <div style={styles.emptyState}>No messages yet. Start the conversation!</div>
          ) : (
            filteredMessages.map((msg, index) => {
              const msgDate = parseMessageDate(msg.timestamp);
              const isToday = new Date().toDateString() === msgDate.toDateString();
              const dateString = isToday ? 'Today' : msgDate.toLocaleDateString();
              
              let showDateDivider = false;
              if (index === 0) {
                showDateDivider = true;
              } else {
                const prevMsgDate = parseMessageDate(filteredMessages[index - 1].timestamp);
                if (msgDate.toDateString() !== prevMsgDate.toDateString()) {
                  showDateDivider = true;
                }
              }

              const senderName = msg.senderName || 'Unknown';
              const messageText = msg.text || '';

              return (
                <React.Fragment key={msg.id}>
                  {showDateDivider && (
                    <div style={styles.dateDivider}>
                      <span>{dateString}</span>
                    </div>
                  )}
                  <div 
                    style={{...styles.messageRow, position: 'relative'}}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => {
                  setHoveredMsgId(null);
                  if (activeReactionMsgId === msg.id) setActiveReactionMsgId(null);
                }}
              >
                <div 
                  style={{...styles.avatar, background: msg.senderPfp ? 'transparent' : '#3b82f6'}}
                  title={currentUser.isAdmin ? "Click to set role" : ""}
                  onClick={() => {
                    if (currentUser.isAdmin) {
                      setRolePromptTarget({ email: msg.senderEmail, name: senderName, currentRole: msg.senderRole });
                      setNewRoleInput(msg.senderRole || '');
                    }
                  }}
                >
                  {msg.senderPfp ? (
                    <img src={msg.senderPfp} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />
                  ) : (
                    senderName.charAt(0)
                  )}
                </div>
                <div style={{...styles.messageContent, flex: 1, minWidth: 0}}>
                  <div style={styles.messageHeader}>
                    <span 
                      style={styles.senderName}
                      onClick={() => {
                        if (currentUser.isAdmin) {
                          setRolePromptTarget({ email: msg.senderEmail, name: senderName, currentRole: msg.senderRole });
                          setNewRoleInput(msg.senderRole || '');
                        }
                      }}
                      title={currentUser.isAdmin ? "Click to set role" : ""}
                    >
                      {senderName}
                    </span>
                    {msg.senderRole && <span style={styles.senderRole}>({msg.senderRole})</span>}
                    <span 
                      style={styles.timestamp}
                      title={`Local time: ${msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !use24HourClock })} (${msgDate.toLocaleDateString()})`}
                    >
                      {formatMessageLocalTime(msg.timestamp, use24HourClock)}
                    </span>
                  </div>
                  
                  {msg.replyTo && (
                    <div style={styles.replyQuoteBlock}>
                      <span style={{color: '#9ca3af', fontSize: '0.8rem'}}>
                        <Reply size={12} style={{marginRight: '4px', display: 'inline', verticalAlign: 'middle'}}/>
                        Replying to <strong>{msg.replyTo.senderName || 'Unknown'}</strong>
                      </span>
                      <div style={{color: '#d1d5db', fontSize: '0.85rem', marginTop: '2px', fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '8px'}}>{msg.replyTo.text}</div>
                    </div>
                  )}
                  
                  <div style={styles.messageText}>
                    {messageText.split(/(@[a-zA-Z0-9_.-]+)/g).map((part, i) => 
                      part.startsWith('@') ? <span key={i} style={{ color: '#06b6d4', fontWeight: 'bold' }}>{part}</span> : part
                    )}
                  </div>
                  
                  {msg.attachmentUrl && (
                    <div style={{ marginTop: '8px', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={msg.attachmentUrl} alt="Attachment" style={{ width: '100%', display: 'block' }} />
                    </div>
                  )}

                  {msg.reactions && msg.reactions.length > 0 && (
                    <div style={styles.reactionsContainer}>
                      {msg.reactions.map(r => (
                        <button 
                          key={r.emoji} 
                          style={{
                            ...styles.reactionBadge, 
                            background: r.users.includes(currentUser.email) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: r.users.includes(currentUser.email) ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'
                          }}
                          onClick={() => addMessageReaction(msg.id, r.emoji)}
                          title={r.users.join(', ')}
                        >
                          {r.emoji} <span style={styles.reactionCount}>{r.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Actions */}
                <div style={{
                  ...styles.messageActions,
                  opacity: (hoveredMsgId === msg.id || activeReactionMsgId === msg.id) ? 1 : 0,
                  visibility: (hoveredMsgId === msg.id || activeReactionMsgId === msg.id) ? 'visible' : 'hidden'
                }}>
                  <button style={styles.actionBtn} onClick={() => setReplyingTo(msg)} title="Reply">
                    <Reply size={14} />
                  </button>
                  <div style={{ position: 'relative' }}>
                    <button style={styles.actionBtn} onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)} title="React">
                      <Smile size={14} />
                    </button>
                    {activeReactionMsgId === msg.id && (
                      <div style={styles.reactionPicker}>
                        {['👍', '❤️', '😂', '😮', '👀', '🔥'].map(emoji => (
                          <button 
                            key={emoji} 
                            style={styles.reactionOptionBtn} 
                            onClick={() => { addMessageReaction(msg.id, emoji); setActiveReactionMsgId(null); }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.senderEmail !== currentUser.email && (
                    <button 
                      style={{ ...styles.actionBtn, color: '#10b981' }} 
                      onClick={() => {
                        const targetUser = (users || []).find(u => u.email === msg.senderEmail) || {
                          email: msg.senderEmail,
                          firstName: msg.senderName || 'Staff',
                          lastName: '',
                          robloxUsername: '',
                          profilePicture: msg.senderPfp || ''
                        };
                        initiateCall(targetUser);
                      }} 
                      title={`Call ${msg.senderName || 'Staff'}`}
                    >
                      <Phone size={14} />
                    </button>
                  )}
                  {msg.senderEmail !== currentUser.email && (
                    <button style={styles.actionBtn} onClick={() => handleReport(msg)} title="Report">
                      <Flag size={14} />
                    </button>
                  )}
                  {(msg.senderEmail === currentUser.email || currentUser.isAdmin || currentUser.siteRole === 'Moderator') && (
                    <button style={{...styles.actionBtn, color: '#ef4444'}} onClick={() => {
                      if(window.confirm('Delete this message?')) deleteChatMessage(msg.id);
                    }} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputContainerWrapper}>
          {replyingTo && (
            <div style={styles.replyingBanner}>
              <div style={styles.replyingBannerText}>
                <Reply size={12} style={{marginRight: '6px', display: 'inline', verticalAlign: 'middle'}}/>
                Replying to <strong>{replyingTo.senderName || 'Unknown'}</strong>: {(replyingTo.text || '').length > 50 ? (replyingTo.text || '').substring(0, 50) + '...' : (replyingTo.text || '')}
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} style={styles.replyingBannerClose}>
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} style={{...styles.inputArea, borderTopLeftRadius: replyingTo ? 0 : '16px', borderTopRightRadius: replyingTo ? 0 : '16px'}}>
            <label style={styles.uploadBtn}>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} disabled={isUploading} />
              <Paperclip size={20} color={attachment ? '#3b82f6' : '#9ca3af'} />
            </label>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attachment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                  <ImageIcon size={14} />
                  <span>{attachment.name}</span>
                  <button type="button" onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
              <input 
                type="text" 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                placeholder={isUploading ? "Uploading attachment..." : `Message ${getChannelName()}`}
                style={styles.input}
                disabled={isUploading}
              />
            </div>
            <button type="submit" className="btn-primary" style={styles.sendBtn} disabled={(!inputText.trim() && !attachment) || isUploading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Role Prompt Modal (Admin Only) */}
      {rolePromptTarget && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <h3>Set Role for {rolePromptTarget.name}</h3>
            <p style={{fontSize: '0.85rem', color: '#9ca3af', marginBottom: '16px'}}>This role will appear in brackets next to their name globally.</p>
            <form onSubmit={handleSetRole}>
              <input 
                autoFocus
                type="text" 
                value={newRoleInput} 
                onChange={e => setNewRoleInput(e.target.value)} 
                className="input-field" 
                placeholder="e.g. Head of Security"
                style={{marginBottom: '16px'}}
              />
              <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setRolePromptTarget(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateGroupModal(false)}>
          <div className="glass-panel" style={{ ...styles.modalContent, width: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#8b5cf6" /> Create Group Chat
              </h3>
              <button 
                onClick={() => setShowCreateGroupModal(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup}>
              <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                Group Name
              </label>
              <input
                autoFocus
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="e.g. Flight Attendants, Operations Team"
                className="input-field"
                style={{ marginBottom: '16px', width: '100%' }}
                required
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '600' }}>
                  Select Staff Members ({selectedGroupMembers.length} selected)
                </label>
                {selectedGroupMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroupMembers([])}
                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Search staff by name or Roblox..."
                value={groupMemberSearch}
                onChange={e => setGroupMemberSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  marginBottom: '10px'
                }}
              />
              
              <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.25)' }}>
                {(users || [])
                  .filter(u => u && u.approved && u.email !== currentUser?.email && u.role !== 'passenger')
                  .filter(u => {
                    if (!groupMemberSearch.trim()) return true;
                    const q = groupMemberSearch.toLowerCase().trim();
                    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
                    const roblox = (u.robloxUsername || '').toLowerCase();
                    return name.includes(q) || roblox.includes(q);
                  })
                  .map(user => {
                    const isSelected = selectedGroupMembers.includes(user.email);
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.robloxUsername || 'Staff';
                    return (
                      <label 
                        key={user.email} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroupMembers(prev => [...prev, user.email]);
                              } else {
                                setSelectedGroupMembers(prev => prev.filter(em => em !== user.email));
                              }
                            }}
                            style={{ accentColor: '#8b5cf6', width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: user.profilePicture ? 'transparent' : '#8b5cf6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            color: '#fff'
                          }}>
                            {user.profilePicture ? (
                              <img src={user.profilePicture} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              fullName.charAt(0)
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', color: '#f3f4f6', fontSize: '0.9rem' }}>
                              {fullName}
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                              @{user.robloxUsername || 'staff'}
                            </span>
                          </div>
                        </div>

                        {user.role && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', color: '#d1d5db', textTransform: 'capitalize' }}>
                            {user.role.replace('_', ' ')}
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateGroupModal(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={!newGroupName.trim()}
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && currentGroup && (
        <div style={styles.modalOverlay} onClick={() => setShowAddMemberModal(false)}>
          <div className="glass-panel" style={{ ...styles.modalContent, width: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#10b981" /> Add Member to {currentGroup.name}
              </h3>
              <button 
                onClick={() => setShowAddMemberModal(false)} 
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMemberToCurrentGroup}>
              <label style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                Select Staff Member
              </label>
              <select
                value={memberToAdd}
                onChange={e => setMemberToAdd(e.target.value)}
                className="input-field"
                style={{ width: '100%', marginBottom: '16px' }}
                required
              >
                <option value="">Choose staff...</option>
                {(users || [])
                  .filter(u => u && u.approved && u.email && !(currentGroup.members || []).includes(u.email) && u.role !== 'passenger')
                  .map(u => (
                    <option key={u.email} value={u.email}>
                      {u.firstName} {u.lastName} (@{u.robloxUsername || 'staff'})
                    </option>
                  ))}
              </select>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddMemberModal(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={!memberToAdd}
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '20px',
    height: 'calc(100vh - 120px)',
  },
  sidebar: {
    width: '240px',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  sidebarTitle: {
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    color: '#9ca3af',
    fontWeight: '700',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  channelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  chatArea: {
    flex: 1,
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  channelName: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
  },
  channelDesc: {
    fontSize: '0.85rem',
    color: '#9ca3af',
  },
  messageList: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  emptyState: {
    margin: 'auto',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  messageRow: {
    display: 'flex',
    gap: '16px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-main)',
    fontWeight: '700',
    fontSize: '1.2rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  senderName: {
    fontWeight: '700',
    color: 'var(--color-text-main)',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  senderRole: {
    color: '#3b82f6',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  timestamp: {
    color: '#6b7280',
    fontSize: '0.75rem',
  },
  messageText: {
    color: '#d1d5db',
    fontSize: '0.95rem',
    lineHeight: '1.4',
  },
  inputArea: {
    padding: '20px 24px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    gap: '12px',
    background: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: 'var(--color-text-main)',
    outline: 'none',
    width: '100%',
  },
  uploadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  dateDivider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '20px 0 10px 0',
    color: '#6b7280',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sendBtn: {
    padding: '0 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modalContent: {
    width: '400px',
    padding: '24px',
    borderRadius: '16px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  inputContainerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    marginTop: 'auto',
  },
  replyingBanner: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderLeft: '4px solid #3b82f6',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  replyingBannerText: {
    fontSize: '0.85rem',
    color: '#d1d5db',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginRight: '16px',
  },
  replyingBannerClose: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  replyQuoteBlock: {
    marginTop: '4px',
    marginBottom: '8px',
    padding: '6px 10px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '6px',
    borderLeft: '3px solid #3b82f6',
  },
  reactionsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '8px',
  },
  reactionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  reactionCount: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  messageActions: {
    position: 'absolute',
    top: '-12px',
    right: '16px',
    display: 'flex',
    gap: '4px',
    background: '#1f2937',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'opacity 0.15s, visibility 0.15s',
    zIndex: 10,
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    padding: '6px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  reactionPicker: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1f2937',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '4px 8px',
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
    zIndex: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  reactionOptionBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
  }
};
