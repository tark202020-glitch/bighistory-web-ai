
async function testChat() {
    try {
        console.log("Sending request to local chat API...");
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'hello' }]
            })
        });

        console.log(`Status: ${response.status}`);

        if (!response.ok) {
            console.error("HTTP Error:", response.statusText);
            const text = await response.text();
            console.error("Body:", text);
            return;
        }

        // Read the stream using Web Streams API (Node 18+)
        const decoder = new TextDecoder();
        for await (const chunk of response.body) {
            console.log(`Received chunk: "${decoder.decode(chunk)}"`);
        }
        console.log("Stream finished.");

    } catch (e) {
        console.error("Connection failed. Is the server running?", e.message);
    }
}

testChat();
