import SignIn from "@/components/SignIn";
export default async function SignInPage({ searchParams }) {
  const params = await searchParams;
  return (
    <main className="auth-container">
      <div className="surface">
        <span className="eyebrow">Good to see you again</span>
        <h1 className="page-title">Welcome back.</h1>
        <p className="subtle mb-7">Sign in to plan your next service or manage your work.</p>
        {params.registered && (
          <p className="feedback success" role="status">
            Account created. You can now sign in.
          </p>
        )}
        <SignIn />
      </div>
    </main>
  );
}
