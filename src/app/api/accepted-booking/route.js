import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import { deleteBooking } from "@/queries/bookings";
import { createAcceptedBooking } from "@/queries/accepted-bookings";

export const POST = async (request) => {
  try {
    const {
      employeeUsername, employeeEmail, employeePhone,
      customerUsername, customerEmail, customerPhone,
      street, city, state, category, service, date
    } = await request.json();

    // ✅ Connect to MongoDB
    await dbConnect();

    // ✅ Move booking to `accepted-bookings`
    await createAcceptedBooking({
      employeeUsername,
      employeeEmail,
      employeePhone,
      customerUsername,
      customerEmail,
      customerPhone,
      street,
      city,
      state,
      category,
      service,
      date: new Date(date),
    });

    // ✅ Delete from `bookings` after acceptance
    await deleteBooking(customerUsername, service, date);

    return NextResponse.json({ message: "Booking accepted and removed from available bookings." }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
};
