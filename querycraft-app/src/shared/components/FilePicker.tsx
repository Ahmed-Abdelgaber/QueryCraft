import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Clock, X, Settings2, Moon, Sun, File, Database, CheckCircle, AlertCircle } from 'lucide-react';
import './FilePicker.css';

interface FilePickerProps {
    onFileSelected: () => void;
    onFilesDropped?: (files: File[]) => void;
    loading: boolean;
}

// Dummy data for recent files
const DUMMY_RECENT_FILES = [
    { name: 'space_missions.log', path: '/data/space_missions.log', size: '2.4 MB', lastOpened: '2 hours ago' },
    { name: 'server_logs.csv', path: '/logs/server_logs.csv', size: '1.1 MB', lastOpened: 'Yesterday' },
    { name: 'analytics_data.json', path: '/exports/analytics_data.json', size: '856 KB', lastOpened: '3 days ago' },
];

export default function FilePicker({ onFileSelected, onFilesDropped, loading }: FilePickerProps) {
    const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
    // Theme state is now managed globally by CSS variables, but we keep this for the toggle button UI logic if needed
    // or we can remove the toggle if the app has a global theme context. For now, we simulate the toggle.
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            console.log('Files dropped:', acceptedFiles);
            if (onFilesDropped) {
                onFilesDropped(acceptedFiles);
            }
        }
    }, [onFilesDropped]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        noClick: true, // We use the custom button for clicking
        multiple: false,
        accept: {
            'text/csv': ['.csv'],
            'application/json': ['.json', '.jsonl'],
            'text/plain': ['.txt', '.log'],
        }
    });

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <div className="file-picker-container animate-fade-in">
            {/* Header Controls */}
            <div className="controls-bar glass-panel">
                <div className="mode-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'simple' ? 'active' : ''}`}
                        onClick={() => setViewMode('simple')}
                    >
                        Simple
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'advanced' ? 'active' : ''}`}
                        onClick={() => setViewMode('advanced')}
                    >
                        <Settings2 size={14} />
                        Advanced
                    </button>
                </div>

                <button
                    className="theme-toggle-btn"
                    onClick={toggleTheme}
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
            </div>

            <div className="file-picker-content">
                {/* Drop Zone */}
                <div
                    {...getRootProps()}
                    className={`drop-zone glass-panel ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${loading ? 'loading' : ''}`}
                >
                    <input {...getInputProps()} />

                    <div className="drop-zone-content">
                        <div className={`icon-wrapper ${isDragActive ? 'bounce' : ''}`}>
                            {loading ? (
                                <div className="loader-ring"><Database size={48} /></div>
                            ) : isDragActive ? (
                                <Upload size={56} className="text-accent" />
                            ) : (
                                <FileText size={56} className="text-secondary" />
                            )}
                        </div>

                        <div className="text-content">
                            <h2>
                                {loading ? 'Processing Data...' : isDragActive ? 'Drop it like it\'s hot' : 'Select or Drop a File'}
                            </h2>
                            <p className="subtitle">
                                {loading ? 'Analyzing structure and converting format' : 'Supports CSV, JSON, LOG, TXT'}
                            </p>
                        </div>

                        {!loading && (
                            <button
                                className="btn btn--primary btn--lg trigger-btn"
                                onClick={onFileSelected}
                                type="button"
                            >
                                <File size={18} />
                                Browse Local Files
                            </button>
                        )}
                    </div>

                    {/* Background decoration */}
                    <div className="drop-zone-bg-pattern"></div>
                </div>

                {/* Advanced Options Panel */}
                {viewMode === 'advanced' && !loading && (
                    <div className="advanced-options glass-panel animate-slide-up">
                        <div className="panel-header">
                            <Settings2 size={18} className="text-accent" />
                            <h3>Parser Configuration</h3>
                        </div>
                        <div className="options-grid">
                            <div className="input-group">
                                <label>File Format</label>
                                <select className="select-input">
                                    <option value="">Auto-Detect</option>
                                    <option value="csv">CSV</option>
                                    <option value="json">JSON</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Encoding</label>
                                <select className="select-input">
                                    <option value="utf8">UTF-8</option>
                                    <option value="ascii">ASCII</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Files */}
                {!loading && (
                    <div className="recent-files-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="section-header">
                            <h3><Clock size={16} /> Recent Files</h3>
                            <button className="btn btn--ghost btn--sm">
                                Clear
                            </button>
                        </div>

                        <div className="recent-grid">
                            {DUMMY_RECENT_FILES.map((file, index) => (
                                <div key={index} className="recent-card glass-panel" onClick={() => console.log('Open', file.path)}>
                                    <div className="file-icon-small">
                                        <FileText size={20} />
                                    </div>
                                    <div className="file-details">
                                        <span className="file-name">{file.name}</span>
                                        <span className="file-meta">{file.size} • {file.lastOpened}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
