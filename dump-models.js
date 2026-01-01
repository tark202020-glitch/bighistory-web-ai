const apiKey = 'AIzaSyDUDPdKF93YK6Q3nM8WNqV8ubvVDI1A7H4';
async function dump() {
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const d = await r.json();
        if (d.models) {
            console.log("--- AVAILABLE MODELS ---");
            d.models.forEach(m => {
                if (m.name.includes('gemini') || m.name.includes('flash') || m.name.includes('pro')) {
                    console.log(m.name);
                }
            });
            console.log("------------------------");
        } else {
            console.log("ERROR:", JSON.stringify(d));
        }
    } catch (e) {
        console.log("NET ERROR", e);
    }
}
dump();
