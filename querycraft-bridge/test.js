#!/usr/bin/env node
/**
 * Quick test script to verify the bridge works
 */

const { GoBridge } = require('./dist/index');
const path = require('path');

async function test() {
    const bridge = new GoBridge();
    const testFile = path.join(__dirname, '../data/space_missions.log');

    console.log('Testing detect...');
    const detected = await bridge.detect(testFile);
    console.log('✅ Detect result:', {
        format: detected.format,
        has_header: detected.has_header,
        columns: detected.columns.length,
    });

    console.log('\nTesting convert...');
    const result = await bridge.convert(testFile, '/tmp/bridge_test.djson', {
        onProgress: (event) => {
            if (event.type === 'progress' && event.rows_processed) {
                process.stdout.write(`\rProcessed: ${event.rows_processed} rows`);
            }
        },
    });
    console.log('\n✅ Convert result:', {
        djson_path: result.djson_path,
        rows_written: result.rows_written,
        bytes_written: result.bytes_written,
        duration_ms: result.duration_ms,
        errors_count: result.errors ? result.errors.length : 0,
    });

    if (result.errors && result.errors.length > 0) {
        console.log(`\n⚠️  Skipped ${result.errors.length} invalid rows`);
        console.log('First few errors:', result.errors.slice(0, 3));
    }
}

test().catch(console.error);
