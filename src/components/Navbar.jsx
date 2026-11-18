import { auth } from "@/auth";
import { getUsersByEmail } from "@/queries/users";
import NavbarClient from "@/components/NavbarClient";

const Navbar = async () => {
  const session = await auth();
  let loggedInUser = session?.user;

  let profileLink = "/profile_cu"; // Default for customers
  if (loggedInUser) {
    try {
      const user = await getUsersByEmail(loggedInUser.email);
      if (user?.service) profileLink = "/profile_em";
    } catch {
      // Public browsing remains usable during a DB outage or stale session.
      loggedInUser = null;
    }
  }

  return <NavbarClient loggedInUser={loggedInUser} profileLink={profileLink} />;
};

export default Navbar;
