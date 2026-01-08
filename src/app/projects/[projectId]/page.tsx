// filepath: src/app/projects/[projectId]/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import admin from "firebase-admin";
import { prisma } from "@/lib/db/prisma";
import BrandKitScanForm from "@/components/BrandKitScanForm";
import ProjectBriefForm from "@/components/ProjectBriefForm";

export const dynamic = "force-dynamic";

function getFirebaseAdmin() {
  if (admin.apps.length) return admin.app();
  const json = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("Missing FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON");
  return admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(json))
  });
}

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) throw new Error("Unauthorized: no session cookie");

  const app = getFirebaseAdmin();
  try {
    return await app.auth().verifySessionCookie(token, true);
  } catch (e) {
    throw new Error("Invalid or expired session. Please log in again.");
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let decodedToken;

  try {
    decodedToken = await requireUser();
  } catch (e) {
    return (
      <div className="p-10 text-center">
        <p className="mb-4 text-red-500">Session expired.</p>
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">Login</Link>
      </div>
    );
  }

  // FIX: Find the internal user first
  const dbUser = await prisma.user.findUnique({
    where: { firebaseUid: decodedToken.uid }
  });

  if (!dbUser) return <div className="p-10 text-center">User setup incomplete.</div>;

  // Fetch project with all related data
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: dbUser.id },
    include: {
      creatives: { orderBy: { createdAt: "desc" } },
      brandKit: true,
      brief: true
    }
  });

  if (!project) return <div className="p-10 text-center text-red-500">Project not found or access denied.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <nav className="mb-2 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link> /
          </nav>
          <h1 className="text-3xl font-bold">{project.name}</h1>
        </div>
        <Link
          href={`/projects/${project.id}/editor/new`}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          + Create New Ad
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Left Column: Brand & Strategy */}
        <div className="space-y-8">
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">1. Brand Identity</h2>
            <p className="mb-4 text-sm text-gray-600">Scan a website to automatically pull tone, colors, and descriptions.</p>
            <BrandKitScanForm projectId={project.id} defaultUrl={project.brandKit?.websiteUrl} />
            
            {project.brandKit && (
              <div className="mt-6 border-t pt-4 text-sm">
                <div className="font-medium text-gray-900">{project.brandKit.brandName || "Scanned Brand"}</div>
                <div className="mt-1 italic text-gray-600">"{project.brandKit.tone}"</div>
              </div>
            )}
          </section>

          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">2. Sale Strategy Brief</h2>
            <ProjectBriefForm projectId={project.id} initialBrief={project.brief} />
          </section>
        </div>

        {/* Right Column: Creatives */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Recent Creatives</h2>
          {project.creatives.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">
              No ads created yet.
            </div>
          ) : (
            <div className="grid gap-4">
              {project.creatives.map((c) => (
                <Link
                  key={c.id}
                  href={`/projects/${project.id}/editor/${c.id}`}
                  className="group flex items-center gap-4 rounded-xl border bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                    {c.selectedImageObjectPath ? (
                      <img 
                        src={`/api/proxy/image?url=${encodeURIComponent(c.selectedImageObjectPath)}`} 
                        className="h-full w-full object-cover" 
                        alt="" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No Img</div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium group-hover:text-blue-600">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.placementSize} • {new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
