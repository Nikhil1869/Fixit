import { doSignOut } from "@/app/actions";
export default function SignOut() {
  return (
    <form action={doSignOut}>
      <button className="btn-secondary btn-small" type="submit">
        Sign out
      </button>
    </form>
  );
}
