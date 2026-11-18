import { dbConnect } from "@/lib/mongo";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const connection = await dbConnect();
    await connection.connection.db.admin().ping();
    return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
