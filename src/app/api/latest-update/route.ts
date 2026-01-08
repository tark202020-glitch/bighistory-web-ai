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

        // Find the first match (latest version)
        const firstMatch = versionRegex.exec(fileContent);

        if (!firstMatch) {
            return NextResponse.json({ error: 'No version history found' }, { status: 404 });
        }

        const version = firstMatch[1];
        const date = firstMatch[2];
        const startIndex = firstMatch.index + firstMatch[0].length;

        // Find the start of the next version to define the end of current content
        const nextMatch = versionRegex.exec(fileContent);
        const endIndex = nextMatch ? nextMatch.index : fileContent.length;

        let content = fileContent.substring(startIndex, endIndex).trim();

        // Optional: Remove any leading/trailing newlines or excessive separators
        content = content.replace(/^[\n\r]+/, '').replace(/[\n\r]+$/, '');

        return NextResponse.json({
            version,
            date,
            content
        });

    } catch (error) {
        console.error('Error parsing changelog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
