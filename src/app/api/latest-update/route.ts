import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const changelogPath = path.join(process.cwd(), 'doc', 'CHANGELOG.md');

        if (!fs.existsSync(changelogPath)) {
            return NextResponse.json({ error: 'Changelog file not found' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(changelogPath, 'utf-8');

        // Regex to match version headers: ## [Version] - Date
        // Captures: 1=Version, 2=Date
        const versionRegex = /^## \[(.*?)\] - (.*?)$/gm;

        let match;
        const updates = [];
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);
        // Reset time part for simplistic comparison
        threeDaysAgo.setHours(0, 0, 0, 0);

        // We need to capture segments.
        // Strategy: Store all matches first
        const matches = [];
        while ((match = versionRegex.exec(fileContent)) !== null) {
            matches.push({
                version: match[1],
                dateStr: match[2],
                index: match.index,
                fullMatch: match[0]
            });
        }

        let combinedContent = "";
        let latestVersion = "";
        let latestDate = "";

        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const next = matches[i + 1];

            // Parse Date
            // Assuming simplified ISO format YYYY-MM-DD
            const entryDate = new Date(current.dateStr);
            // Fix for potential timezone issues: standard string parsing usually assumes UTC or local. 
            // We just need relative diff.

            // Calculate difference in time not just days to be safe, or just check if >= threeDaysAgo
            // Since we want "Last 3 Days of WORK", maybe we should just take the top 3 if dates are weird?
            // User said "최근 3일 작업물" (content from the last 3 days).
            // Let's stick to date comparison. 
            // Note: If entryDate is invalid, skip or include? Assume valid.

            // To be generous with timezones, let's set entryDate to end of day or just compare timestamps
            entryDate.setHours(23, 59, 59, 999);

            if (entryDate >= threeDaysAgo) {
                // Determine content end index
                const startIndex = current.index; // Include header? User might want to see headers.
                const endIndex = next ? next.index : fileContent.length;

                const segment = fileContent.substring(startIndex, endIndex).trim();

                combinedContent += segment + "\n\n";

                if (!latestVersion) {
                    latestVersion = current.version;
                    latestDate = current.dateStr;
                }
            } else {
                // Since changelog is ordered desc, once we hit older dates, we can stop?
                // Probably yes.
                break;
            }
        }

        if (!combinedContent) {
            // Fallback: If no recent updates in 3 days, maybe just return the LATEST one?
            // Or return nothing?
            // User intent: "Showing changed points". If nothing changed in 3 days, show nothing?
            // But if I login after a week, I might miss everything.
            // "오늘 작업 내용을 보여주는데... 안내 할때 최근 3일..." -> This implies when showing, show extended context.
            // If nothing matches, let's just return the single latest one as a fallback so the modal isn't empty if triggered.
            if (matches.length > 0) {
                const current = matches[0];
                const next = matches[1];
                const endIndex = next ? next.index : fileContent.length;
                combinedContent = fileContent.substring(current.index, endIndex).trim();
                latestVersion = current.version;
                latestDate = current.dateStr;
            } else {
                return NextResponse.json({ error: 'No version history found' }, { status: 404 });
            }
        }

        return NextResponse.json({
            version: latestVersion,
            date: latestDate, // Only specific to the latest
            content: combinedContent,
            isMultiple: combinedContent.split('## [').length > 2 // Rough check if multiple versions
        });

    } catch (error) {
        console.error('Error parsing changelog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
