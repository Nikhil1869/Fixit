"use client";
export default function ErrorPage({ reset }) {
  return (
    <main className="page-container section-space">
      <div className="empty-state">
        <h1 className="page-title">Something went wrong.</h1>
        <p>We could not load this page. Please try again in a moment.</p>
        <button onClick={reset} className="btn mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
