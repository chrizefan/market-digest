import { useState, useMemo } from 'react';
import { marked } from 'marked';

export default function Library({ docs }) {
  const [selectedId, setSelectedId] = useState(docs[0]?.id || null);
  const [search, setSearch] = useState('');

  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.filename.toLowerCase().includes(q) ||
      d.type.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const selectedDoc = useMemo(() => docs.find(d => d.id === selectedId), [docs, selectedId]);

  // Group by "type" (folder logic from python)
  const grouped = filteredDocs.reduce((acc, doc) => {
    (acc[doc.type] = acc[doc.type] || []).push(doc);
    return acc;
  }, {});

  const renderMarkdown = (content) => {
    return { __html: marked.parse(content || '') };
  };

  return (
    <div className="library-layout">
      {/* Sidebar Navigation */}
      <div className="library-sidebar glass-card" style={{ padding: '16px 8px' }}>
        <input 
          type="text" 
          placeholder="Search documents..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="modern-select"
          style={{ width: 'calc(100% - 16px)', margin: '0 8px 16px 8px' }}
        />
        
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} style={{ marginBottom: '16px' }}>
            <div className="doc-folder-label">{type}</div>
            {items.map(doc => (
              <div 
                key={doc.id}
                className={`doc-item ${selectedId === doc.id ? 'active' : ''}`}
                onClick={() => setSelectedId(doc.id)}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: selectedId === doc.id ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {doc.date} • {doc.filename}
                </div>
              </div>
            ))}
          </div>
        ))}
        {filteredDocs.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No documents found.
          </div>
        )}
      </div>

      {/* Content Viewer */}
      <div className="library-content glass-card">
        {selectedDoc ? (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <span className="badge badge-blue">{selectedDoc.type}</span>
              <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{selectedDoc.date}</span>
              <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{selectedDoc.filename}</span>
            </div>
            <div 
              className="md-content"
              dangerouslySetInnerHTML={renderMarkdown(selectedDoc.content)} 
            />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select a document to read
          </div>
        )}
      </div>
    </div>
  );
}
