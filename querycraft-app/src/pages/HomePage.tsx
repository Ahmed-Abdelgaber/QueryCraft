import { Upload, FileText, Moon, Sun, History as HistoryIcon } from 'lucide-react';
import { Button } from '../shared/components/Button';
import { Select } from '../shared/components/Select';
import { Input } from '../shared/components/Input';
import { Toggle } from '../shared/components/Toggle';
import { Card } from '../shared/components/Card';
import { Badge } from '../shared/components/Badge';
import { EmptyState } from '../shared/components/EmptyState';
import { Modal } from '../shared/components/Modal';
import { useFileSelection } from '../features/fileManagement/hooks/useFileSelection';
import { useFileDetection } from '../features/fileManagement/hooks/useFileDetection';
import { useFileConversion } from '../features/fileManagement/hooks/useFileConversion';
import { useTheme } from '../features/settings';
import { dummyHistory } from '../data/dummy';
import { formatDistanceToNow } from 'date-fns';
import './HomePage.css';

const Code = ({ size }: { size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

export default function HomePage() {
    const { theme, toggleTheme } = useTheme();
    const {
        selectedFile,
        isDragging,
        handleFileSelect,
        handleDrop,
        handleDragOver,
        handleDragEnter,
        handleDragLeave
    } = useFileSelection();

    const {
        isDetecting,
        detectedFeatures,
        showModal,
        detectFile,
        closeModal,
        updateFeatures
    } = useFileDetection();

    const { isConverting, convertFile } = useFileConversion();

    const handleParse = async () => {
        if (!selectedFile) return;

        try {
            await detectFile(selectedFile.path);
        } catch (error) {
            alert(`Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleParseFromModal = async () => {
        if (!selectedFile) return;

        try {
            closeModal();
            const result = await convertFile(selectedFile.path, selectedFile.name);
            const params = new URLSearchParams({
                djson: result.djsonPath,
                file: result.fileName
            });
            window.location.hash = `/explorer?${params.toString()}`;
        } catch (error) {
            alert(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const isLoading = isDetecting || isConverting;

    return (
        <div className="home">
            {/* Premium Header */}
            <header className="home-header">
                <div className="home-header-content">
                    {/* Logo Section */}
                    <div className="header-brand">
                        <div className="brand-logo">
                            <Code size={24} />
                        </div>
                        <div className="brand-text">
                            <h1>QueryCraft</h1>
                            <span className="brand-badge">Beta</span>
                        </div>
                    </div>

                    {/* Navigation (Visual Only) */}
                    <nav className="header-nav">
                        <a href="#" className="nav-item">Documentation</a>
                        <a href="#" className="nav-item">GitHub</a>
                        <div className="nav-divider"></div>
                        <Button variant="ghost" size="sm" onClick={toggleTheme} className="theme-toggle">
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </Button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <div className="home-container">
                {/* File Drop Zone */}
                <Card variant="default" padding="lg" className="file-drop-card">
                    <div
                        className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                    >
                        <div className="file-drop-icon">
                            <Upload size={48} />
                        </div>
                        <h2>Drop your file here</h2>
                        <p className="file-drop-subtitle">or</p>
                        <Button variant="primary" size="lg" onClick={handleFileSelect}>
                            Choose File
                        </Button>
                        {selectedFile && (
                            <div className="file-drop-path">
                                <div className="file-drop-path-icon">
                                    <FileText size={24} />
                                </div>
                                <div className="file-drop-path-info">
                                    <strong>{selectedFile.name}</strong>
                                    <span>{selectedFile.path}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Parsing Configuration */}
                <Card variant="default" padding="lg" className="config-card">
                    <h3 className="section-title">Parsing Options</h3>

                    <div className="config-grid">
                        <Select
                            label="Format"
                            value={detectedFeatures?.format || 'csv'}
                            options={[
                                { value: 'csv', label: 'CSV' },
                                { value: 'json', label: 'JSON' },
                                { value: 'jsonl', label: 'JSONL' }
                            ]}
                            onChange={(e) => {
                                if (detectedFeatures) {
                                    updateFeatures({ ...detectedFeatures, format: e.target.value as any });
                                }
                            }}
                            fullWidth
                        />

                        <Input
                            label="Delimiter"
                            value={detectedFeatures?.delimiter || ','}
                            onChange={(e) => {
                                if (detectedFeatures) {
                                    updateFeatures({ ...detectedFeatures, delimiter: e.target.value });
                                }
                            }}
                            helperText="Character that separates fields"
                            fullWidth
                        />

                        <Input
                            label="Comment Character"
                            value={detectedFeatures?.comment || '#'}
                            onChange={(e) => {
                                if (detectedFeatures) {
                                    updateFeatures({ ...detectedFeatures, comment: e.target.value });
                                }
                            }}
                            helperText="Lines starting with this will be ignored"
                            fullWidth
                        />

                        <Input
                            label="Field Count"
                            type="number"
                            value={detectedFeatures?.field_count?.toString() || '0'}
                            onChange={(e) => {
                                if (detectedFeatures) {
                                    updateFeatures({ ...detectedFeatures, field_count: parseInt(e.target.value) || 0 });
                                }
                            }}
                            helperText="Expected number of fields per row"
                            fullWidth
                        />

                        <div style={{ gridColumn: '1 / -1' }}>
                            <Toggle
                                label="Has Header Row"
                                checked={detectedFeatures?.has_header || false}
                                onChange={(e) => {
                                    if (detectedFeatures) {
                                        updateFeatures({ ...detectedFeatures, has_header: e.target.checked });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="config-actions">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => {
                                // Reset to default values or clear detection
                                if (detectedFeatures) {
                                    updateFeatures({
                                        format: 'csv',
                                        delimiter: ',',
                                        comment: '#',
                                        has_header: true,
                                        field_count: 0,
                                        columns: []
                                    });
                                }
                            }}
                            disabled={!detectedFeatures}
                        >
                            Reset Options
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleParse}
                            disabled={!selectedFile || isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Parse File'}
                        </Button>
                    </div>
                </Card>

                {/* History Section */}
                <div className="history-section">
                    <div className="section-header">
                        <h3><HistoryIcon size={24} /> Recent Files</h3>
                    </div>
                    <div className="history-grid">
                        {dummyHistory.length > 0 ? (
                            dummyHistory.map((item) => (
                                <Card key={item.id} variant="default" padding="md" className="history-card">
                                    <div className="history-card-header">
                                        <div className="history-card-icon">
                                            <FileText size={24} />
                                        </div>
                                        <div className="history-card-info">
                                            <div className="history-card-name">{item.filename}</div>
                                            <div className="history-card-path">{item.path}</div>
                                        </div>
                                        <Badge variant={item.status === 'success' ? 'success' : 'danger'}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div className="history-card-meta">
                                        <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                                        {item.rowsParsed && <span>• {item.rowsParsed.toLocaleString()} rows</span>}
                                        {item.duration && <span>• {item.duration}ms</span>}
                                    </div>
                                    {item.error && (
                                        <div className="history-card-error">{item.error}</div>
                                    )}
                                </Card>
                            ))
                        ) : (
                            <EmptyState
                                icon={<FileText size={48} />}
                                title="No recent files"
                                description="Files you parse will appear here for quick access"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Detection Modal */}
            {detectedFeatures && (
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title="Detected File Features"
                    size="lg"
                    footer={
                        <>
                            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button variant="primary" onClick={handleParseFromModal}>
                                Parse with These Settings
                            </Button>
                        </>
                    }
                >
                    <div className="detection-modal-content">
                        <p className="detection-message">
                            Review the automatically detected features for <strong>{selectedFile?.name}</strong>
                        </p>
                        <div className="config-grid" style={{ marginTop: '1.5rem' }}>
                            <Select
                                label="Format"
                                value={detectedFeatures.format}
                                options={[
                                    { value: 'csv', label: 'CSV' },
                                    { value: 'json', label: 'JSON' },
                                    { value: 'jsonl', label: 'JSONL' }
                                ]}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateFeatures({ ...detectedFeatures, format: e.target.value as any })}
                                fullWidth
                            />

                            <Input
                                label="Delimiter"
                                value={detectedFeatures.delimiter}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFeatures({ ...detectedFeatures, delimiter: e.target.value })}
                                helperText="Character that separates fields"
                                fullWidth
                            />

                            <Input
                                label="Comment Character"
                                value={detectedFeatures.comment}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFeatures({ ...detectedFeatures, comment: e.target.value })}
                                helperText="Lines starting with this will be ignored"
                                fullWidth
                            />

                            <Input
                                label="Field Count"
                                type="number"
                                value={detectedFeatures.field_count.toString()}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFeatures({ ...detectedFeatures, field_count: parseInt(e.target.value) || 0 })}
                                helperText="Expected number of fields per row"
                                fullWidth
                            />

                            <div style={{ gridColumn: '1 / -1' }}>
                                <Toggle
                                    label="Has Header Row"
                                    checked={detectedFeatures.has_header}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFeatures({ ...detectedFeatures, has_header: e.target.checked })}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                Detected Columns ({detectedFeatures.columns.length})
                            </h4>
                            <div className="columns-list">
                                {detectedFeatures.columns.map((col, idx) => (
                                    <div key={idx} className="column-item">
                                        <span className="column-index">{col.index}</span>
                                        <span className="column-name">{col.name}</span>
                                        <Badge variant="info" size="sm">{col.type}</Badge>
                                        <Toggle
                                            checked={col.include}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const newCols = [...detectedFeatures.columns];
                                                newCols[idx] = { ...newCols[idx], include: e.target.checked };
                                                updateFeatures({ ...detectedFeatures, columns: newCols });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
