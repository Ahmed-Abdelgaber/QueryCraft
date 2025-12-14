#!/usr/bin/env node
/**
 * Test DuckDB integration with DJSON output from Go CLI
 */

const { GoBridge } = require('./dist/index');
const path = require('path');
const duckdb = require('duckdb');

async function testDuckDB() {
    const bridge = new GoBridge();
    const testFile = path.join(__dirname, '../data/space_missions.log');
    const djsonFile = '/tmp/duckdb_test.djson';

    console.log('📁 Converting file to DJSON...');
    const result = await bridge.convert(testFile, djsonFile);

    console.log('✅ Conversion complete:');
    console.log(`  - Rows: ${result.rows_written.toLocaleString()}`);
    console.log(`  - Size: ${(result.bytes_written / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Errors: ${result.errors ? result.errors.length.toLocaleString() : 0}`);
    console.log(`  - Time: ${result.duration_ms}ms`);

    console.log('\n🦆 Loading into DuckDB...');

    return new Promise((resolve, reject) => {
        // Create in-memory DuckDB database
        const db = new duckdb.Database(':memory:');

        db.all(`
            CREATE TABLE missions AS 
            SELECT * FROM read_json_auto('${djsonFile}')
        `, (err) => {
            if (err) {
                console.error('❌ Failed to load DJSON:', err.message);
                reject(err);
                return;
            }

            console.log('✅ Data loaded into DuckDB\n');

            // Run test queries
            runQueries(db, resolve, reject);
        });
    });
}

function runQueries(db, resolve, reject) {
    const queries = [
        {
            name: 'Table Info',
            sql: "DESCRIBE missions"
        },
        {
            name: 'Row Count',
            sql: "SELECT COUNT(*) as total_rows FROM missions"
        },
        {
            name: 'Sample Data',
            sql: "SELECT * FROM missions LIMIT 5"
        },
        {
            name: 'Aggregation Test',
            sql: `
                SELECT 
                    Destination,
                    COUNT(*) as mission_count,
                    AVG("Crew Size") as avg_crew,
                    AVG("Success Rate") as avg_success_rate
                FROM missions
                GROUP BY Destination
                ORDER BY mission_count DESC
                LIMIT 10
            `
        },
        {
            name: 'Date Range',
            sql: `
                SELECT 
                    MIN(Date) as earliest,
                    MAX(Date) as latest,
                    COUNT(DISTINCT Date) as unique_dates
                FROM missions
            `
        }
    ];

    let currentQuery = 0;

    function runNextQuery() {
        if (currentQuery >= queries.length) {
            console.log('\n🎉 All tests passed!');
            db.close();
            resolve();
            return;
        }

        const query = queries[currentQuery++];
        console.log(`\n📊 ${query.name}:`);
        console.log(`   SQL: ${query.sql.trim().substring(0, 60)}...`);

        db.all(query.sql, (err, rows) => {
            if (err) {
                console.error(`❌ Query failed: ${err.message}`);
                reject(err);
                return;
            }

            console.table(rows);
            runNextQuery();
        });
    }

    runNextQuery();
}

testDuckDB().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
