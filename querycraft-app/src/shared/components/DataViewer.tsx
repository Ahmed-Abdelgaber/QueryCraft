interface DataViewerProps {
    data: any[];
    columns: any[];
    onQuery: (sql: string) => void;
    onNewFile: () => void;
    loading: boolean;
}

export default function DataViewer({ data, columns, onQuery, onNewFile, loading }: DataViewerProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onQuery(e.currentTarget.value);
        }
    };

    return (
        <div className="screen viewer">
            <div className="viewer-header">
                <h2>📊 Data Viewer</h2>
                <div className="stats">
                    <span>{data.length} rows loaded</span>
                    <span>•</span>
                    <span>{columns.length} columns</span>
                </div>
            </div>

            <div className="query-box">
                <input
                    type="text"
                    placeholder="SELECT * FROM data WHERE ..."
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />
                <button onClick={onNewFile}>New File</button>
            </div>

            <div className="table-container">
                {data.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                {Object.keys(data[0]).map((key) => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i}>
                                    {Object.values(row).map((val: any, j) => (
                                        <td key={j}>{String(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
