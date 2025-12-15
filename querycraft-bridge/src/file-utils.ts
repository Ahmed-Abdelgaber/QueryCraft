import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

/**
 * File system utilities for QueryCraft
 */

/**
 * Generate a temporary file path for converted DJSON output
 * @param inputPath Original input file path
 * @returns Path to temporary DJSON file
 */
export function getTempDjsonPath(inputPath?: string): string {
    const tmpDir = os.tmpdir();
    const timestamp = Date.now();

    if (inputPath) {
        const basename = path.basename(inputPath, path.extname(inputPath));
        return path.join(tmpDir, `querycraft_${basename}_${timestamp}.djson`);
    }

    return path.join(tmpDir, `querycraft_output_${timestamp}.djson`);
}

/**
 * Clean up temporary files
 * @param filePath Path to file to delete
 */
export async function cleanupTempFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                // Ignore "file not found" errors
                return reject(new Error(`Failed to delete temp file: ${err.message}`));
            }
            resolve();
        });
    });
}

/**
 * Check if file exists
 * @param filePath Path to check
 * @returns True if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            resolve(!err);
        });
    });
}

/**
 * Get file size in bytes
 * @param filePath Path to file
 * @returns File size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return reject(new Error(`Failed to get file size: ${err.message}`));
            }
            resolve(stats.size);
        });
    });
}
