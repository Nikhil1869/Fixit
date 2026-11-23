import Link from "next/link";
import { ArrowUpRight, Home, Wrench } from "lucide-react";
export default function SignUpPage() {
  return (
    <main className="page-container section-space">
      <div className="max-w-3xl mx-auto">
        <span className="eyebrow">Welcome to Fixit</span>
        <h1 className="page-title">How will you use Fixit?</h1>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Link className="surface" href="/signupCustomer">
            <Home className="accent mb-6" size={32} />
            <h2>I need a service.</h2>
            <p className="subtle my-4">Find help, book a visit, and follow its progress.</p>
            <span className="text-link">
              Customer account <ArrowUpRight size={18} />
            </span>
          </Link>
          <Link className="surface" href="/signupEmployee">
            <Wrench className="accent mb-6" size={32} />
            <h2>I provide a service.</h2>
            <p className="subtle my-4">Set your hours and manage customer requests.</p>
            <span className="text-link">
              Provider account <ArrowUpRight size={18} />
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
