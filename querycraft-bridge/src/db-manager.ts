import { Database } from 'duckdb';

/**
 * DuckDB Manager - Handles all database operations for QueryCraft
 * Provides a clean API for loading data and executing queries
 */
export class DuckDBManager {
    private db: Database | null = null;
    private tableName: string = 'data';

    /**
     * Load a DJSON file into DuckDB in-memory database
     * @param djsonPath Path to the DJSON file
     * @returns Column information from the loaded data
     */
    async loadData(djsonPath: string): Promise<{ columns: any[] }> {
        return new Promise((resolve, reject) => {
            // Create new in-memory database
            this.db = new Database(':memory:');

            // Create table from DJSON file using DuckDB's read_json_auto
            const createQuery = `CREATE TABLE ${this.tableName} AS SELECT * FROM read_json_auto('${djsonPath}')`;

            this.db.all(createQuery, (err) => {
                if (err) {
                    return reject(new Error(`Failed to load data: ${err.message}`));
                }

                // Describe the table to get column information
                this.db!.all(`DESCRIBE ${this.tableName}`, (err, columns) => {
                    if (err) {
                        return reject(new Error(`Failed to describe table: ${err.message}`));
                    }
                    resolve({ columns });
                });
            });
        });
    }

    /**
     * Execute a SQL query against the loaded data
     * @param sql SQL query to execute
     * @param limit Maximum number of rows to return (default: 100)
     * @returns Query results as array of row objects
     */
    async query(sql: string, limit: number = 100): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('No database loaded. Call loadData() first.'));
            }

            // Add LIMIT if not already present in query
            const finalQuery = sql.includes('LIMIT') ? sql : `${sql} LIMIT ${limit}`;

            this.db.all(finalQuery, (err, rows) => {
                if (err) {
                    return reject(new Error(`Query failed: ${err.message}`));
                }
                resolve(rows || []);
            });
        });
    }

    /**
     * Get column information for the loaded table
     * @returns Column metadata
     */
    async getColumns(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('No database loaded. Call loadData() first.'));
            }

            this.db.all(`DESCRIBE ${this.tableName}`, (err, columns) => {
                if (err) {
                    return reject(new Error(`Failed to get columns: ${err.message}`));
                }
                resolve(columns || []);
            });
        });
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return resolve();
            }

            this.db.close((err) => {
                if (err) {
                    return reject(new Error(`Failed to close database: ${err.message}`));
                }
                this.db = null;
                resolve();
            });
        });
    }

    /**
     * Check if database is loaded and ready
     */
    isReady(): boolean {
        return this.db !== null;
    }

    /**
     * Get total row count from the loaded table
     * @returns Total number of rows
     */
    async getRowCount(): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('No database loaded. Call loadData() first.'));
            }

            this.db.all(`SELECT COUNT(*) as count FROM ${this.tableName}`, (err, rows) => {
                if (err) {
                    return reject(new Error(`Failed to get row count: ${err.message}`));
                }
                resolve(rows?.[0]?.count || 0);
            });
        });
    }

    /**
     * Get unique values for a specific column
     * @param columnName Name of the column
     * @returns Array of unique values
     */
    async getUniqueValues(columnName: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('No database loaded. Call loadData() first.'));
            }

            const query = `SELECT DISTINCT "${columnName}" FROM ${this.tableName} WHERE "${columnName}" IS NOT NULL ORDER BY "${columnName}" LIMIT 1000`;

            this.db.all(query, (err, rows) => {
                if (err) {
                    return reject(new Error(`Failed to get unique values: ${err.message}`));
                }
                resolve(rows?.map(row => row[columnName]) || []);
            });
        });
    }

    /**
     * Get filtered row count with WHERE clause
     * @param whereClause SQL WHERE clause (without the WHERE keyword)
     * @returns Filtered row count
     */
    async getFilteredRowCount(whereClause?: string): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return reject(new Error('No database loaded. Call loadData() first.'));
            }

            let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
            if (whereClause) {
                query += ` WHERE ${whereClause}`;
            }

            this.db.all(query, (err, rows) => {
                if (err) {
                    return reject(new Error(`Failed to get filtered row count: ${err.message}`));
                }
                resolve(Number(rows?.[0]?.count || 0));
            });
        });
    }
}
