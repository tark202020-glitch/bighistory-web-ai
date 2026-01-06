import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'user-profile.json');

function getUserData() {
    if (!fs.existsSync(DATA_PATH)) {
        return { name: "User", password: "password" };
    }
    const file = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(file);
}

function saveUserData(data: any) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
    const data = getUserData();
    // Don't return password in GET for security (mock or not)
    return NextResponse.json({ name: data.name });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, currentPassword, newPassword, type } = body;
        const currentData = getUserData();

        if (type === 'updateName') {
            currentData.name = name;
            saveUserData(currentData);
            return NextResponse.json({ success: true, name: currentData.name });
        }

        if (type === 'updatePassword') {
            if (currentData.password !== currentPassword) {
                return NextResponse.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, { status: 400 });
            }
            currentData.password = newPassword;
            saveUserData(currentData);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
