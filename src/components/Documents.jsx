import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Search, BookOpen, User, Calendar, Plus, Trash2, Tag, ChevronRight } from 'lucide-react';

export default function Documents() {
  const { documents, addDocument, deleteDocument, currentUser } = useApp();
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form state for creating document
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Protocol');
  const [content, setContent] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title || !content) return;

    addDocument({
      title,
      category,
      content
    });

    setTitle('');
    setCategory('Protocol');
    setContent('');
    setIsCreating(false);
    setSuccessMsg('Document published successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
    // Select the newly created document (which is unshifted to start of array)
    if (documents.length > 0) {
      setSelectedDocId(documents[0].id);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocument(id);
      if (selectedDocId === id) {
        setSelectedDocId(documents.find(d => d.id !== id)?.id || null);
      }
    }
  };

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeDoc = documents.find(d => d.id === selectedDocId) || filteredDocs[0];

  const categories = ['All', 'Protocol', 'Policy', 'Guide', 'Announcement'];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Very basic markdown-to-HTML parser for headers, lists, and bold text
  const renderDocumentContent = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} style={styles.markdownH4}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} style={styles.markdownH3}>{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} style={styles.markdownH2}>{line.replace('# ', '')}</h2>;
      }
      if (line.startsWith('* ')) {
        return <li key={idx} style={styles.markdownLi}>{line.replace('* ', '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '12px' }} />;
      }
      return <p key={idx} style={styles.markdownP}>{line}</p>;
    });
  };

  return (
    <div style={styles.container}>
      {successMsg && (
        <div style={styles.successAlert}>
          <span>{successMsg}</span>
        </div>
      )}

      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.searchBox}>
              <Search size={16} style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '38px', height: '40px' }}
              />
            </div>
            
            {currentUser.isAdmin && !isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="btn-primary"
                style={styles.addBtn}
              >
                <Plus size={16} />
                <span>Create</span>
              </button>
            )}
          </div>

          <div style={styles.categoryFilter}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.categoryBtn,
                  background: selectedCategory === cat ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255,255,255,0.02)',
                  borderColor: selectedCategory === cat ? '#2563eb' : 'rgba(255,255,255,0.05)',
                  color: selectedCategory === cat ? 'var(--color-text-main)' : '#9ca3af'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={styles.docList}>
            {filteredDocs.length === 0 ? (
              <p style={styles.emptySidebarText}>No documents found.</p>
            ) : (
              filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => { setSelectedDocId(doc.id); setIsCreating(false); }}
                  style={{
                    ...styles.docItem,
                    background: (activeDoc?.id === doc.id && !isCreating) ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    borderColor: (activeDoc?.id === doc.id && !isCreating) ? 'rgba(37, 99, 235, 0.25)' : 'transparent'
                  }}
                >
                  <div style={styles.docItemContent}>
                    <FileText size={16} color={activeDoc?.id === doc.id && !isCreating ? '#3b82f6' : '#9ca3af'} />
                    <div style={styles.docItemMeta}>
                      <span style={{
                        ...styles.docItemTitle,
                        color: (activeDoc?.id === doc.id && !isCreating) ? 'var(--color-text-main)' : '#d1d5db'
                      }}>
                        {doc.title}
                      </span>
                      <span style={styles.docItemCat}>{doc.category}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Body */}
        <div style={styles.contentArea} className="glass-panel">
          {isCreating ? (
            <form onSubmit={handleCreate} style={styles.form}>
              <div style={styles.formHeader}>
                <h3 style={styles.formTitle}>Publish New Document</h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="btn-secondary"
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>

              <div style={styles.row}>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Uniform Regulations V2.0"
                    className="input-field"
                  />
                </div>

                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="Protocol">Protocol</option>
                    <option value="Policy">Policy</option>
                    <option value="Guide">Guide</option>
                    <option value="Announcement">Announcement</option>
                  </select>
                </div>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Document Body Content * (Markdown styling available: #, ##, ###, *)</label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter page content. Start sections with # for Titles, ## for Headings, and * for bullet lists..."
                  className="input-field"
                  style={styles.textarea}
                  rows={12}
                />
              </div>

              <button type="submit" className="btn-primary" style={styles.publishBtn}>
                Publish Document
              </button>
            </form>
          ) : activeDoc ? (
            <div style={styles.reader}>
              <div style={styles.readerHeader}>
                <div style={styles.readerMeta}>
                  <span style={styles.readerCategory}>
                    <Tag size={12} style={{ marginRight: '6px' }} />
                    {activeDoc.category}
                  </span>
                  <h1 style={styles.readerTitle}>{activeDoc.title}</h1>
                  <div style={styles.readerAuthorship}>
                    <div style={styles.metaItem}>
                      <User size={14} />
                      <span>{activeDoc.authorName}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <Calendar size={14} />
                      <span>{formatDate(activeDoc.date)}</span>
                    </div>
                  </div>
                </div>

                {currentUser.isAdmin && (
                  <button
                    onClick={(e) => handleDelete(activeDoc.id, e)}
                    className="btn-danger"
                    style={styles.deleteDocBtn}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <div style={styles.readerBody}>
                {renderDocumentContent(activeDoc.content)}
              </div>
            </div>
          ) : (
            <div style={styles.emptyReader}>
              <BookOpen size={48} color="rgba(255,255,255,0.15)" />
              <p style={styles.emptyReaderText}>Select a document from the sidebar to start reading.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '0.9rem',
    color: '#a7f3d0',
  },
  layout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  sidebar: {
    flex: 1,
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebarHeader: {
    display: 'flex',
    gap: '10px',
  },
  searchBox: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: 'rgba(255,255,255,0.3)',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  categoryFilter: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  categoryBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  docList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '500px',
    overflowY: 'auto',
    background: 'rgba(0,0,0,0.15)',
    padding: '8px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  docItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
  },
  docItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  docItemMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  docItemTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  docItemCat: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  emptySidebarText: {
    fontSize: '0.85rem',
    color: '#9ca3af',
    textAlign: 'center',
    padding: '20px 0',
  },
  contentArea: {
    flex: 2.5,
    minWidth: '500px',
    padding: '32px',
    borderRadius: '16px',
  },
  emptyReader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    height: '350px',
  },
  emptyReaderText: {
    color: '#9ca3af',
    fontSize: '0.95rem',
  },
  reader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  readerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '20px',
    gap: '16px',
  },
  readerMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  readerCategory: {
    fontSize: '0.75rem',
    color: '#3b82f6',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  readerTitle: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    lineHeight: '1.25',
  },
  readerAuthorship: {
    display: 'flex',
    gap: '20px',
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deleteDocBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  readerBody: {
    fontSize: '0.95rem',
    color: '#d1d5db',
    lineHeight: '1.6',
    maxHeight: '550px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  // Document text formatting
  markdownH2: {
    fontSize: '1.35rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
    marginTop: '20px',
    marginBottom: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    paddingBottom: '6px',
  },
  markdownH3: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
    marginTop: '16px',
    marginBottom: '8px',
  },
  markdownH4: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: '12px',
    marginBottom: '6px',
  },
  markdownP: {
    marginBottom: '12px',
  },
  markdownLi: {
    marginLeft: '20px',
    marginBottom: '6px',
    listStyleType: 'square',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '16px',
  },
  formTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  },
  cancelBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    gap: '20px',
  },
  inputWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#d1d5db',
  },
  textarea: {
    resize: 'vertical',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  publishBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
};
