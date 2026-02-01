const http = require('http');

const TOTAL_REQUESTS = 100;
const CONCURRENCY = 10;
const URL = 'http://localhost/sparx/api/inventory/read.php?page=1&limit=50';

let completed = 0;
let success = 0;
let failed = 0;
let totalTime = 0;
let startTime = Date.now();

const makeRequest = () => {
    return new Promise((resolve) => {
        const reqStart = Date.now();
        http.get(URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - reqStart;
                totalTime += duration;
                if (res.statusCode === 200) {
                    success++;
                } else {
                    failed++;
                    console.log(`Failed: ${res.statusCode}`);
                }
                completed++;
                resolve();
            });
        }).on('error', (err) => {
            console.error(err.message);
            failed++;
            completed++;
            resolve();
        });
    });
};

const runBatch = async () => {
    const promises = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        if (completed + promises.length < TOTAL_REQUESTS) {
            promises.push(makeRequest());
        }
    }
    await Promise.all(promises);
    if (completed < TOTAL_REQUESTS) {
        await runBatch();
    }
};

(async () => {
    console.log(`Starting Stress Test: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrent...`);
    await runBatch();
    const totalDuration = (Date.now() - startTime) / 1000;
    const avgLatency = totalTime / TOTAL_REQUESTS;

    console.log('\n--- Results ---');
    console.log(`Total Time: ${totalDuration.toFixed(2)}s`);
    console.log(`Successful: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Avg Latency: ${avgLatency.toFixed(0)}ms`);
    console.log(`RPS: ${(TOTAL_REQUESTS / totalDuration).toFixed(2)}`);

    if (avgLatency > 3000) {
        console.error("FAIL: Avg Latency > 3000ms");
        process.exit(1);
    } else {
        console.log("PASS: Performance within limits.");
    }
})();
