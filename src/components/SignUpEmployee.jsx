import AuthForm from "@/components/AuthForm";
export default function SignUpEmployee() {
  return (
    <div className="auth-container wide">
      <div className="surface">
        <span className="eyebrow">Your skills, your schedule</span>
        <h1 className="page-title">Join as a provider.</h1>
        <p className="subtle mb-7">Offer a service, set your hours, and manage your requests.</p>
        <AuthForm mode="provider" />
      </div>
    </div>
  );
}
