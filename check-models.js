const apiKey = 'AIzaSyCP4Su9-7uE4ZB-ofrN-LXVM8CPIaDUVVU';

console.log('Checking available models for API Key:', apiKey.substring(0, 10) + '...');

async function checkModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error('API Error:', JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                }
            });
        } else {
            console.log('Unexpected response:', data);
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

checkModels();
