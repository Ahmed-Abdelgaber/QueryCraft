import { useState } from 'react';
import type { DetectedFeatures } from '../types';

export function useFileDetection() {
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectedFeatures, setDetectedFeatures] = useState<DetectedFeatures | null>(null);
    const [showModal, setShowModal] = useState(false);

    const detectFile = async (filePath: string) => {
        try {
            setIsDetecting(true);
            console.log('🔍 Detecting file features:', filePath);

            const response = await window.electron.detectFile(filePath);
            console.log('✅ Detection complete:', response);

            const detected: DetectedFeatures = {
                format: response.format,
                delimiter: response.delimiter?.delimiter || ',',
                comment: response.comment || '#',
                has_header: response.has_header,
                field_count: response.field_count,
                columns: response.columns.map((col, idx) => ({
                    index: idx + 1,
                    name: col.name,
                    type: col.type.toLowerCase(),
                    include: true
                }))
            };

            setDetectedFeatures(detected);
            setShowModal(true);
            return detected;
        } catch (error) {
            console.error('❌ Detection failed:', error);
            throw error;
        } finally {
            setIsDetecting(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const updateFeatures = (features: DetectedFeatures) => {
        setDetectedFeatures(features);
    };

    return {
        isDetecting,
        detectedFeatures,
        showModal,
        detectFile,
        closeModal,
        updateFeatures
    };
}
