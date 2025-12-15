// Dummy data for development
export const dummyFile = {
    name: 'sales_data_2024.csv',
    path: '/Users/john/Documents/sales_data_2024.csv',
    size: '2.4 MB',
    lastModified: '2024-12-14 15:30'
};

export const dummyConfig = {
    format: 'csv' as 'csv' | 'json' | 'jsonl',
    delimiter: ',',
    comment: '#',
    has_header: true,
    field_count: 8,
    columns: [
        { index: 0, name: 'id', type: 'integer', include: true },
        { index: 1, name: 'date', type: 'date', include: true },
        { index: 2, name: 'product', type: 'text', include: true },
        { index: 3, name: 'quantity', type: 'integer', include: true },
        { index: 4, name: 'price', type: 'decimal', include: true },
        { index: 5, name: 'customer', type: 'text', include: true },
        { index: 6, name: 'region', type: 'text', include: true },
        { index: 7, name: 'notes', type: 'text', include: false }
    ]
};

export const dummyHistory = [
    {
        id: '1',
        filename: 'sales_data_2024.csv',
        path: '/Users/john/Documents/sales_data_2024.csv',
        timestamp: '2024-12-14T15:30:00',
        status: 'success' as const,
        format: 'csv' as const,
        rowsParsed: 15243,
        duration: 1234,
        outputPath: '/tmp/output_1.djson'
    },
    {
        id: '2',
        filename: 'analytics_export.json',
        path: '/Downloads/analytics_export.json',
        timestamp: '2024-12-13T10:15:00',
        status: 'success' as const,
        format: 'json' as const,
        rowsParsed: 8921,
        duration: 892,
        outputPath: '/tmp/output_2.djson'
    },
    {
        id: '3',
        filename: 'error_logs.txt',
        path: '/var/log/error_logs.txt',
        timestamp: '2024-12-12T14:20:00',
        status: 'failed' as const,
        format: 'log' as const,
        error: 'Invalid delimiter configuration'
    },
    {
        id: '4',
        filename: 'user_events.jsonl',
        path: '/data/user_events.jsonl',
        timestamp: '2024-12-11T09:45:00',
        status: 'success' as const,
        format: 'jsonl' as const,
        rowsParsed: 54219,
        duration: 3421,
        outputPath: '/tmp/output_4.djson'
    }
];
