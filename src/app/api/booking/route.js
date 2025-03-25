import { NextResponse } from "next/server";
import { createBooking } from "@/queries/bookings";
import { getUsersByService } from "@/queries/users"; // ✅ Function to check worker availability
import { dbConnect } from "@/lib/mongo";

export const POST = async (request) => {
  try {
    const { username, email, phone, street, city, state, service, date } = await request.json();

    // ✅ Connect to MongoDB
    await dbConnect();

    // ✅ Check if at least one worker is available for the selected service
    const workers = await getUsersByService(service);
    if (workers.length === 0) {
      return NextResponse.json({ message: "No worker available for this service." }, { status: 400 });
    } 

    // ✅ Ensure date is stored correctly
    const newBooking = {
      username,
      email,
      phone,
      street,
      city,
      state,
      service,
      date: new Date(date),
    };

    // ✅ Store in MongoDB
    await createBooking(newBooking);

    return NextResponse.json({ message: "Booking has been created" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
};

