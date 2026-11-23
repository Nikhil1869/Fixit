import AuthForm from "@/components/AuthForm";
export default function SignUpCustomer() {
  return (
    <div className="auth-container wide">
      <div className="surface">
        <span className="eyebrow">Make life a little simpler</span>
        <h1 className="page-title">Create your account.</h1>
        <p className="subtle mb-7">Your next helping hand starts here.</p>
        <AuthForm mode="customer" />
      </div>
    </div>
  );
}
