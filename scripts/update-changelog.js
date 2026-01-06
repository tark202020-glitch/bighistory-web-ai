const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'doc', 'CHANGELOG.md');

try {
    let content = fs.readFileSync(changelogPath, 'utf8');

    // Regex to find the last version (e.g., ## [Alpha V1.001] or ## [Alpha V1.0])
    // We look for patterns like ## [Alpha V1.0] or ## [Alpha V1.001]
    const versionRegex = /## \[Alpha V(\d+\.\d+)\]/;
    const match = content.match(versionRegex);

    let nextVersion = '1.001';

    if (match) {
        const currentVersionStr = match[1]; // e.g., "1.0" or "1.001"
        const currentVersionNum = parseFloat(currentVersionStr);

        // Increment by 0.001
        // We handle floating point precision by operating on integers if needed, 
        // but simple toFixed(3) usually works for this scale.

        // Actually, user wants .001 increments. 
        // Let's parse, add 0.001, and format.
        // Identify precision.
        const decimalPart = currentVersionStr.split('.')[1] || "";
        // If "1.0", treat as 1.000 for calculation but user said "start with 1.001" from 1.0.

        let nextVerNum = currentVersionNum + 0.001;
        // Fix precision issues (e.g. 1.00100000002)
        nextVersion = nextVerNum.toFixed(3);

        // Remove trailing zeros if user prefers compact? No, user implied .001 step, so 3 decimal places is likely desired.
        // User example: "Alpha V1.001로 시작해서 .001 단위로"
    }

    const now = new Date();
    // Format: YYYY-MM-DD HH:mm:ss
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

    // Get summary from command line args or default
    const summary = process.argv[2] || "Auto-generated build update.";

    const newEntry = `
## [Alpha V${nextVersion}] - ${dateStr}

### 🔄 Build Update
- **Summary**: ${summary}
- **Build Time**: ${dateStr}
`;

    // Insert after the header (after line 7 roughly, or after the first "##" block starts?)
    // Typically prepending to the list of versions.
    // We look for the first occurrence of `## [` and insert before it.

    const insertIndex = content.indexOf('## [');
    if (insertIndex === -1) {
        // If no versions exist, append to end (or after header)
        content += newEntry;
    } else {
        content = content.slice(0, insertIndex) + newEntry + '\n' + content.slice(insertIndex);
    }

    fs.writeFileSync(changelogPath, content, 'utf8');
    console.log(`Changelog updated to Alpha V${nextVersion}`);

} catch (error) {
    console.error('Failed to update changelog:', error);
    process.exit(1);
}
