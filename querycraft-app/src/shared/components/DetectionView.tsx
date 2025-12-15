interface DetectionViewProps {
    detection: any;
    onBack: () => void;
    onConvert: () => void;
    loading: boolean;
}

export default function DetectionView({ detection, onBack, onConvert, loading }: DetectionViewProps) {
    return (
        <div className="screen">
            <div className="card">
                <h2>🔍 Detection Results</h2>

                <div className="info-grid">
                    <div className="info-item">
                        <span className="label">Format:</span>
                        <span className="value">{detection.format.toUpperCase()}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Columns:</span>
                        <span className="value">{detection.columns.length}</span>
                    </div>
                    <div className="info-item">
                        <span className="label">Has Header:</span>
                        <span className="value">{detection.has_header ? 'Yes' : 'No'}</span>
                    </div>
                    {detection.delimiter && (
                        <div className="info-item">
                            <span className="label">Delimiter:</span>
                            <span className="value">{detection.delimiter.delimiter}</span>
                        </div>
                    )}
                </div>

                <h3>Columns Detected:</h3>
                <div className="columns-preview">
                    {detection.columns.map((col: any, i: number) => (
                        <div key={i} className="column-tag">
                            <strong>{col.name}</strong>
                            <span>{col.type}</span>
                        </div>
                    ))}
                </div>

                <div className="actions">
                    <button onClick={onBack}>← Back</button>
                    <button
                        className="primary"
                        onClick={onConvert}
                        disabled={loading}
                    >
                        {loading ? 'Converting...' : 'Convert & Load →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
