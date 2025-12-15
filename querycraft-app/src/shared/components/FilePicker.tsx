import { useState, useRef } from 'react';
import { Upload, FileText, Clock, X, Settings2, Moon, Sun, File, Database } from 'lucide-react';
import './FilePicker.css';

interface FilePickerProps {
    onFileSelected: () => void;
    loading: boolean;
}

// Dummy data for recent files (TODO: Replace with real data from persistence)
const DUMMY_RECENT_FILES = [
    { name: 'space_missions.log', path: '/data/space_missions.log', size: '2.4 MB', lastOpened: '2 hours ago' },
    { name: 'server_logs.csv', path: '/logs/server_logs.csv', size: '1.1 MB', lastOpened: 'Yesterday' },
    { name: 'analytics_data.json', path: '/exports/analytics_data.json', size: '856 KB', lastOpened: '3 days ago' },
    { name: 'access_logs.txt', path: '/var/log/access_logs.txt', size: '3.2 MB', lastOpened: 'Last week' },
];

export default function FilePicker({ onFileSelected, loading }: FilePickerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const dragCounter = useRef(0);

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // TODO: Handle dropped file - need to pass file object to backend
            // For now, call onFileSelected to trigger the file picker as fallback
            console.log('File dropped:', e.dataTransfer.files[0]);
            // NOTE: Don't call onFileSelected here - it opens file picker dialog
            // We need proper file handling integration
        }
    };

    const handleRecentFileClick = (filePath: string) => {
        // TODO: Load recent file by path
        console.log('Loading recent file:', filePath);
        onFileSelected();
    };

    return (
        <div className={`file-picker-container theme-${theme}`}>
            {/* Theme & Mode Controls */}
            <div className="controls-bar">
                <div className="mode-toggle">
                    <button
                        className={viewMode === 'simple' ? 'active' : ''}
                        onClick={() => setViewMode('simple')}
                    >
                        Simple
                    </button>
                    <button
                        className={viewMode === 'advanced' ? 'active' : ''}
                        onClick={() => setViewMode('advanced')}
                    >
                        <Settings2 size={16} />
                        Advanced
                    </button>
                </div>

                <button
                    className="theme-toggle"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <div className="file-picker-content">
                {/* Main Drop Zone */}
                <div
                    className={`drop-zone ${isDragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="drop-zone-icon">
                        {loading ? <Database size={64} className="spin" /> : isDragging ? <Upload size={64} /> : <FileText size={64} />}
                    </div>
                    <h2>
                        {loading ? 'Analyzing File...' : isDragging ? 'Drop file here' : 'Select a Log File'}
                    </h2>
                    <p className="drop-zone-subtitle">
                        {loading ? 'Detecting format and structure' : 'Drag & drop your file or browse to select'}
                    </p>

                    {!loading && (
                        <button
                            className="browse-button primary"
                            onClick={onFileSelected}
                            disabled={loading}
                        >
                            <File size={20} />
                            Browse Files
                        </button>
                    )}

                    <div className="supported-formats">
                        <span>Supported: CSV, JSON, JSONL, LOG, TXT</span>
                    </div>
                </div>

                {/* Advanced Mode Filters */}
                {viewMode === 'advanced' && !loading && (
                    <div className="advanced-options">
                        <h3><Settings2 size={20} /> Advanced Options</h3>
                        <div className="filter-grid">
                            <label>
                                <span>File Format</span>
                                <select>
                                    <option value="">Auto-detect</option>
                                    <option value="csv">CSV</option>
                                    <option value="json">JSON</option>
                                    <option value="jsonl">JSONL</option>
                                    <option value="log">LOG</option>
                                </select>
                            </label>
                            <label>
                                <span>Encoding</span>
                                <select>
                                    <option value="utf8">UTF-8</option>
                                    <option value="ascii">ASCII</option>
                                    <option value="latin1">Latin-1</option>
                                </select>
                            </label>
                            <label>
                                <span>Max Rows Preview</span>
                                <input type="number" defaultValue={100} min={10} max={1000} />
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" defaultChecked />
                                <span>Auto-detect delimiter</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Recent Files Section */}
                {!loading && (
                    <div className="recent-files-section">
                        <div className="section-header">
                            <h3><Clock size={24} /> Recent Files</h3>
                            <button className="clear-history-btn" title="Clear history">
                                <X size={16} />
                                Clear All
                            </button>
                        </div>

                        <div className="recent-files-grid">
                            {DUMMY_RECENT_FILES.map((file, index) => (
                                <button
                                    key={index}
                                    className="recent-file-card"
                                    onClick={() => handleRecentFileClick(file.path)}
                                    disabled={loading}
                                >
                                    <div className="file-icon">
                                        <FileText size={28} />
                                    </div>
                                    <div className="file-info">
                                        <div className="file-name">{file.name}</div>
                                        <div className="file-meta">
                                            <span className="file-size">{file.size}</span>
                                            <span className="file-separator">•</span>
                                            <span className="file-time">{file.lastOpened}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {DUMMY_RECENT_FILES.length === 0 && (
                            <div className="empty-state">
                                <FileText size={48} opacity={0.3} />
                                <p>No recent files yet</p>
                                <p className="empty-state-hint">Files you open will appear here for quick access</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
