import { useState } from 'react';
import type { FileInfo } from '../types';
import { useElectronAPI } from '../../../shared/hooks/useElectronAPI';

export function useFileSelection() {
    const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const electron = useElectronAPI();

    const handleFileSelect = async () => {
        try {
            const filePath = await electron.selectFile();
            if (filePath) {
                const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
                setSelectedFile({
                    name: fileName,
                    path: filePath
                });
                console.log('📁 File selected:', fileName, filePath);
            }
        } catch (error) {
            console.error('Error selecting file:', error);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0] as any;
            const filePath = file.path;

            if (filePath) {
                setSelectedFile({
                    name: file.name,
                    path: filePath
                });
                console.log('✅ File dropped:', file.name, filePath);
            } else {
                console.warn('⚠️ file.path not available:', file);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const clearFile = () => {
        setSelectedFile(null);
    };

    return {
        selectedFile,
        isDragging,
        handleFileSelect,
        handleDrop,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        clearFile
    };
}
