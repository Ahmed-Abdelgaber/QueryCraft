import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import * as path from 'path';
import * as os from 'os';
import {
    DetectResponse,
    DetectOptions,
    ConvertResult,
    ConvertOptions,
    ConvertEvent,
    ErrorResponse,
} from './types';

export class GoBridge {
    private binaryPath: string;

    constructor(binaryPath?: string) {
        // Default: use binary in ../go/cmd/qcparser
        this.binaryPath = binaryPath || this.getDefaultBinaryPath();
    }

    private getDefaultBinaryPath(): string {
        // Assume binary is at ../go/cmd/qcparser relative to this package
        const platform = os.platform();
        const binaryName = platform === 'win32' ? 'qcparser.exe' : 'qcparser';
        return path.join(__dirname, '../../go/cmd', binaryName);
    }

    /**
     * Detect file format and structure
     */
    async detect(filePath: string, options: DetectOptions = {}): Promise<DetectResponse> {
        const args = ['detect', '--file=' + filePath];

        if (options.sampleBytes) {
            args.push('--sample-bytes=' + options.sampleBytes);
        }
        if (options.maxPreviewRows) {
            args.push('--max-preview-rows=' + options.maxPreviewRows);
        }

        const { stdout, stderr, code } = await this.runCommand(args);

        if (code !== 0) {
            throw this.parseError(stderr);
        }

        return JSON.parse(stdout) as DetectResponse;
    }

    /**
     * Convert file to DJSON format with progress streaming
     */
    async convert(
        inputPath: string,
        outputPath: string,
        options: ConvertOptions = {}
    ): Promise<ConvertResult> {
        const args = ['convert', '--input=' + inputPath, '--output=' + outputPath];

        return new Promise((resolve, reject) => {
            const proc = spawn(this.binaryPath, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });

            let result: ConvertResult | null = null;

            // Parse NDJSON events from stdout
            const stdoutReader = createInterface({ input: proc.stdout });
            stdoutReader.on('line', (line) => {
                try {
                    const event: ConvertEvent = JSON.parse(line);

                    // Emit progress events to callback
                    if (options.onProgress) {
                        options.onProgress(event);
                    }

                    // Capture final result
                    if (event.type === 'result') {
                        result = {
                            djson_path: event.djson_path,
                            rows_written: event.rows_written,
                            bytes_written: event.bytes_written,
                            duration_ms: event.duration_ms,
                            errors: event.errors,  // Include errors array
                        };
                    }
                } catch (err) {
                    // Ignore invalid JSON lines (shouldn't happen)
                    console.warn('Failed to parse NDJSON event:', line);
                }
            });

            // Collect stderr for error messages
            let stderrData = '';
            proc.stderr.on('data', (chunk) => {
                stderrData += chunk.toString();
            });

            // Handle abort signal
            if (options.signal) {
                options.signal.addEventListener('abort', () => {
                    proc.kill('SIGTERM');
                    reject(new Error('Conversion aborted'));
                });
            }

            // Handle process exit
            proc.on('exit', (code) => {
                if (code === 0 && result) {
                    resolve(result);
                } else {
                    reject(this.parseError(stderrData));
                }
            });

            proc.on('error', (err) => {
                reject(new Error(`Failed to spawn Go binary: ${err.message}`));
            });
        });
    }

    /**
     * Run a Go CLI command and capture output
     */
    private runCommand(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
        return new Promise((resolve) => {
            const proc = spawn(this.binaryPath, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (chunk) => {
                stdout += chunk.toString();
            });

            proc.stderr.on('data', (chunk) => {
                stderr += chunk.toString();
            });

            proc.on('exit', (code) => {
                resolve({ stdout, stderr, code: code || 0 });
            });

            proc.on('error', (err) => {
                resolve({ stdout: '', stderr: err.message, code: 1 });
            });
        });
    }

    /**
     * Parse error response from stderr
     */
    private parseError(stderr: string): Error {
        try {
            const errorResponse: ErrorResponse = JSON.parse(stderr);
            const err = new Error(errorResponse.error.message);
            (err as any).code = errorResponse.error.code;
            (err as any).details = errorResponse.error.details;
            return err;
        } catch {
            // If not JSON, return raw stderr
            return new Error(stderr || 'Unknown error from Go CLI');
        }
    }
}
