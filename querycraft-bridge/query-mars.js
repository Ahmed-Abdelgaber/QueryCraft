#!/usr/bin/env node
/**
 * Query: Find the security code of the longest successful Mars mission
 */

const { GoBridge } = require('./dist/index');
const path = require('path');
const duckdb = require('duckdb');

async function findLongestMarsMission() {
    const bridge = new GoBridge();
    const testFile = path.join(__dirname, '../data/space_missions.log');
    const djsonFile = '/tmp/mars_query.djson';

    console.log('📁 Converting file to DJSON...');
    const result = await bridge.convert(testFile, djsonFile);
    console.log(`✅ Converted ${result.rows_written.toLocaleString()} rows\n`);

    console.log('🦆 Loading into DuckDB...');

    return new Promise((resolve, reject) => {
        const db = new duckdb.Database(':memory:');

        db.all(`
            CREATE TABLE missions AS 
            SELECT * FROM read_json_auto('${djsonFile}')
        `, (err) => {
            if (err) {
                reject(err);
                return;
            }

            console.log('✅ Data loaded\n');
            console.log('🔍 Finding longest successful Mars mission...\n');

            // Query for longest Mars mission with "Completed" status
            const query = `
                SELECT 
                    "Security Code",
                    "Duration (days)" as duration,
                    "Mission ID" as mission_id,
                    Date,
                    Destination,
                    Status
                FROM missions
                WHERE Destination = 'Mars' 
                  AND Status = 'Completed'
                ORDER BY "Duration (days)" DESC
                LIMIT 1
            `;

            db.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (rows.length === 0) {
                    console.log('❌ No completed Mars missions found');
                } else {
                    const mission = rows[0];
                    console.log('🎯 RESULT:');
                    console.log('═══════════════════════════════════════');
                    console.log(`Security Code:  ${mission['Security Code']}`);
                    console.log(`Duration:       ${mission.duration} days`);
                    console.log(`Mission ID:     ${mission.mission_id}`);
                    console.log(`Date:           ${new Date(mission.Date).toISOString().split('T')[0]}`);
                    console.log(`Destination:    ${mission.Destination}`);
                    console.log(`Status:         ${mission.Status}`);
                    console.log('═══════════════════════════════════════');
                }

                // Also show some stats
                console.log('\n📊 Mars Mission Statistics:');
                const statsQuery = `
                    SELECT 
                        COUNT(*) as total_mars_missions,
                        SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) as completed_missions,
                        AVG("Duration (days)") as avg_duration,
                        MAX("Duration (days)") as max_duration
                    FROM missions
                    WHERE Destination = 'Mars'
                `;

                db.all(statsQuery, (err, stats) => {
                    if (!err && stats.length > 0) {
                        console.table(stats);
                    }
                    db.close();
                    resolve();
                });
            });
        });
    });
}

findLongestMarsMission().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
