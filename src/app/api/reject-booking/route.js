// import { NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongo";
// import { deleteBooking } from "@/queries/bookings";

// export const POST = async (request) => {
//   try {
//     const { username, service, date } = await request.json();

//     // ✅ Connect to MongoDB
//     await dbConnect();

//     // ✅ Delete declined booking from `bookings`
//     await deleteBooking(username, service, date);

//     return NextResponse.json({ message: "Booking declined and removed." }, { status: 200 });
//   } catch (err) {
//     return NextResponse.json({ message: err.message }, { status: 500 });
//   }
// };


import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { deleteBooking } from "@/queries/bookings";

export const POST = async (request) => {
  try {
    const { username, service, date } = await request.json();

    // ✅ Connect to MongoDB
    await dbConnect();

    // ✅ Delete declined booking from `bookings`
    await deleteBooking(username, service, date);

    return NextResponse.json({ message: "Booking declined and removed." }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
};
