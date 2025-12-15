import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useElectronAPI } from './useElectronAPI';

interface UseQueryCraftReturn {
    // State
    filePath: string;
    detection: any;
    data: any[];
    columns: any[];
    loading: boolean;
    error: string;

    // Actions
    selectFile: () => Promise<void>;
    convertFile: () => Promise<void>;
    runQuery: (sql: string) => Promise<void>;
    goBack: () => void;
    resetToFilePicker: () => void;
    dismissError: () => void;
}

/**
 * Custom hook for QueryCraft business logic
 * Encapsulates all state and Electron IPC interactions
 * Uses React Router for navigation
 */
export function useQueryCraft(): UseQueryCraftReturn {
    const navigate = useNavigate();
    const electron = useElectronAPI();
    const [filePath, setFilePath] = useState<string>('');
    const [detection, setDetection] = useState<any>(null);
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    /**
     * Handle file selection and detection
     */
    const selectFile = async () => {
        try {
            setError('');
            const path = await electron.selectFile();

            if (path) {
                setFilePath(path);
                setLoading(true);

                const detected = await electron.detectFile(path);
                setDetection(detected);

                setLoading(false);
                navigate('/detection');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to select file');
            setLoading(false);
        }
    };

    /**
     * Handle file conversion and data loading
     */
    const convertFile = async () => {
        try {
            setError('');
            setLoading(true);

            const outputPath = '/tmp/querycraft_output.djson';
            await electron.convertFile(filePath, outputPath);

            // Load into DuckDB
            const result = await electron.loadData(outputPath);
            setColumns(result.columns);

            // Query first 100 rows
            const rows = await electron.queryData('SELECT * FROM data', 100);
            setData(rows);

            setLoading(false);
            navigate('/viewer');
        } catch (err: any) {
            setError(err.message || 'Failed to convert file');
            setLoading(false);
        }
    };

    /**
     * Run a SQL query
     */
    const runQuery = async (sql: string) => {
        try {
            setError('');
            setLoading(true);

            const rows = await electron.queryData(sql);
            setData(rows);

            setLoading(false);
        } catch (err: any) {
            setError(err.message || 'Query failed');
            setLoading(false);
        }
    };

    /**
     * Go back to previous screen
     */
    const goBack = () => {
        navigate(-1);
    };

    /**
     * Reset to file picker screen
     */
    const resetToFilePicker = () => {
        setFilePath('');
        setDetection(null);
        setData([]);
        setColumns([]);
        setError('');
        navigate('/');
    };

    /**
     * Dismiss error message
     */
    const dismissError = () => {
        setError('');
    };

    return {
        // State
        filePath,
        detection,
        data,
        columns,
        loading,
        error,

        // Actions
        selectFile,
        convertFile,
        runQuery,
        goBack,
        resetToFilePicker,
        dismissError,
    };
}
