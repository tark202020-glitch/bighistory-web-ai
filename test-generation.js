const apiKey = 'AIzaSyDUDPdKF93YK6Q3nM8WNqV8ubvVDI1A7H4';

const candidates = [
    'gemini-2.5-pro',
    'gemini-2.0-flash-001'
];

async function testModel(modelName) {
    console.log(`Testing ${modelName}...`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });
        const data = await response.json();
        if (data.error) {
            console.log(`❌ ${modelName}: Failed (${data.error.code} - ${data.error.message})`);
            return false;
        } else {
            console.log(`✅ ${modelName}: Success!`);
            return true;
        }
    } catch (e) {
        console.log(`❌ ${modelName}: Network Error`);
        return false;
    }
}

async function runTests() {
    console.log('Starting Model Availability Tests...');
    for (const model of candidates) {
        await testModel(model);
    }
}

runTests();
