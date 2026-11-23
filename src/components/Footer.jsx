import Link from "next/link";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <div>
          <Link className="brand" href="/">
            fixit<span className="brand-dot">.</span>
          </Link>
          <p className="subtle mt-2">A team project. Built to make service simpler.</p>
        </div>
        <div className="footer-links">
          <Link href="/homeservices">Services</Link>
          <Link href="/aboutus">Team & credits</Link>
          <a href="https://github.com/Nikhil1869/Fixit">Source code ↗</a>
        </div>
        <p className="subtle text-sm">© {new Date().getFullYear()} Fixit team</p>
      </div>
    </footer>
  );
}
