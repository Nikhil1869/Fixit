import { auth } from "@/auth";
import { getUsersByEmail } from "@/queries/users";
import { getBookingsByEmail } from "@/queries/bookings";
import DashboardEmployee from "@/components/DashboardEmployee";

const EmployeePage = async () => {
    const session = await auth();
    if (!session?.user?.email) {
        return <p>Not authenticated</p>;
    }

    // Fetch user
    const user = await getUsersByEmail(session.user.email);
    if (!user?.service) {
        return <p>You are not registered as a worker.</p>;
    }

    // Fetch bookings
    const bookings = await getBookingsByEmail(null, user.service);

    // ✅ Ensure `_id` and date fields are serialized properly
    const serializedUser = JSON.parse(JSON.stringify(user));
    const serializedBookings = bookings.map(booking => JSON.parse(JSON.stringify(booking)));

    return <DashboardEmployee user={serializedUser} bookings={serializedBookings} />;
};

export default EmployeePage;
