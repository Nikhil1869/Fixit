import { auth } from "@/auth";
import { getUsersByEmail } from "@/queries/users";
import NavbarClient from "@/components/NavbarClient";

const Navbar = async () => {
  const session = await auth();
  const loggedInUser = session?.user;

  let profileLink = "/profile_cu"; // Default for customers
  if (loggedInUser) {
    const user = await getUsersByEmail(loggedInUser.email);
    if (user?.service) profileLink = "/profile_em"; // Employees
  }

  return <NavbarClient loggedInUser={loggedInUser} profileLink={profileLink} />;
};

export default Navbar;
