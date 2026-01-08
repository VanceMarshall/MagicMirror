// filepath: src/app/api/projects/[projectId]/brief/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { cookies } from "next/headers";
import admin from "firebase-admin";

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) throw new Error("Unauthorized");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON!))
    });
  }
  return await admin.auth().verifySessionCookie(token, true);
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    await requireUser();
    const { projectId } = await params;
    const body = await req.json();

    const brief = await prisma.projectBrief.upsert({
      where: { projectId },
      update: body,
      create: { ...body, projectId }
    });

    return NextResponse.json(brief);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
