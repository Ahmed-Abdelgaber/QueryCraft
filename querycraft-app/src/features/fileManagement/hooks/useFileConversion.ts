import { useState } from 'react';

export function useFileConversion() {
    const [isConverting, setIsConverting] = useState(false);

    const convertFile = async (filePath: string, fileName: string) => {
        try {
            setIsConverting(true);
            console.log('🚀 Starting file conversion:', filePath);

            const timestamp = Date.now();
            const outputPath = `/tmp/querycraft_${timestamp}.djson`;

            const result = await window.electron.convertFile(filePath, outputPath);
            console.log('✅ Conversion complete:', result);

            return {
                djsonPath: result.djson_path || outputPath,
                fileName
            };
        } catch (error) {
            console.error('❌ Conversion failed:', error);
            throw error;
        } finally {
            setIsConverting(false);
        }
    };

    return {
        isConverting,
        convertFile
    };
}
