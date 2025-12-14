import { useState } from 'react';
import './App.css';

type Screen = 'picker' | 'converting' | 'viewer';

function App() {
  const [screen, setScreen] = useState<Screen>('picker');
  const [filePath, setFilePath] = useState<string>('');
  const [djsonPath, setDjsonPath] = useState<string>('');
  const [detection, setDetection] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const selectFile = async () => {
    try {
      const path = await window.electron.selectFile();
      if (path) {
        setFilePath(path);
        setLoading(true);
        const detected = await window.electron.detectFile(path);
        setDetection(detected);
        setLoading(false);
        setScreen('converting');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const convertFile = async () => {
    try {
      setLoading(true);
      const outputPath = '/tmp/querycraft_output.djson';
      await window.electron.convertFile(filePath, outputPath);
      setDjsonPath(outputPath);

      // Load into DuckDB
      const result = await window.electron.loadData(outputPath);
      setColumns(result.columns);

      // Query first 100 rows
      const rows = await window.electron.queryData('SELECT * FROM data', 100);
      setData(rows);

      setLoading(false);
      setScreen('viewer');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const runQuery = async (sql: string) => {
    try {
      setLoading(true);
      const rows = await window.electron.queryData(sql);
      setData(rows);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>🚀 QueryCraft</h1>
        <p>Parse and explore log files with ease</p>
      </header>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {screen === 'picker' && (
        <div className="screen">
          <div className="card">
            <h2>📁 Select Log File</h2>
            <p>Choose a CSV, JSON, JSONL, or log file to analyze</p>
            <button
              className="primary"
              onClick={selectFile}
              disabled={loading}
            >
              {loading ? 'Detecting...' : 'Select File'}
            </button>
          </div>
        </div>
      )}

      {screen === 'converting' && detection && (
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
              <button onClick={() => setScreen('picker')}>← Back</button>
              <button
                className="primary"
                onClick={convertFile}
                disabled={loading}
              >
                {loading ? 'Converting...' : 'Convert & Load →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'viewer' && (
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  runQuery(e.currentTarget.value);
                }
              }}
            />
            <button onClick={() => setScreen('picker')}>New File</button>
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
      )}
    </div>
  );
}

export default App;
