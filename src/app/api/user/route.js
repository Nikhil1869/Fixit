// import { auth } from "@/auth";
// import { getUsersByEmail } from "@/queries/users";

// export async function GET(req) {
//     const session = await auth();

//     if (!session?.user?.email) {
//         return Response.json({ error: "Not authenticated" }, { status: 401 });
//     }

//     const user = await getUsersByEmail(session.user.email);
//     if (!user) {
//         return Response.json({ error: "User not found" }, { status: 404 });
//     }

//     return Response.json(user, { status: 200 });
// }


import { auth } from "@/auth";
import { getUsersByEmail } from "@/queries/users";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = await getUsersByEmail(session.user.email);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
