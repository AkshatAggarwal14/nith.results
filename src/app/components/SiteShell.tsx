import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export function Topbar() {
  return (
    <div className="navbar">
      <div className="navinner">
        <Link href="/" className="brand">
          <span className="mark">N</span>
          <span>
            NITH <em>Results</em>
          </span>
        </Link>
        <nav>
          <Link href="/">Leaderboard</Link>
          <Link href="/docs" className="nav-api-btn" title="OpenAPI Documentation">
            <svg
              className="openapi-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.2a9.78 9.78 0 0 1 8.86 5.62l-3.32 1.92a6 6 0 0 0-5.54-3.74c-3.31 0-6 2.69-6 6 0 1.25.39 2.41 1.05 3.37L3.93 17.5A9.76 9.76 0 0 1 2.2 12c0-5.41 4.39-9.8 9.8-9.8zm6.46 9.8c0 3.31-2.69 6-6 6a5.98 5.98 0 0 1-4.24-1.76l-2.92 2.92A9.77 9.77 0 0 0 12 21.8c5.41 0 9.8-4.39 9.8-9.8 0-.96-.14-1.89-.4-2.77l-3.5 2.02c.36.85.56 1.77.56 2.75z" />
            </svg>
            <span>API Docs</span>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="fgrid">
        <div>
          <div className="fbrand">
            <span className="mark">N</span>
            <span>NITH Results</span>
          </div>
          <p style={{ opacity: 0.65 }}>
            Student results and rankings for NIT Hamirpur, scraped from the
            official portal.
          </p>
        </div>
        <div className="fcol">
          <h5>Developers</h5>
          <Link href="/docs" className="footer-api-link">
            <svg
              className="openapi-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.2a9.78 9.78 0 0 1 8.86 5.62l-3.32 1.92a6 6 0 0 0-5.54-3.74c-3.31 0-6 2.69-6 6 0 1.25.39 2.41 1.05 3.37L3.93 17.5A9.76 9.76 0 0 1 2.2 12c0-5.41 4.39-9.8 9.8-9.8zm6.46 9.8c0 3.31-2.69 6-6 6a5.98 5.98 0 0 1-4.24-1.76l-2.92 2.92A9.77 9.77 0 0 0 12 21.8c5.41 0 9.8-4.39 9.8-9.8 0-.96-.14-1.89-.4-2.77l-3.5 2.02c.36.85.56 1.77.56 2.75z" />
            </svg>
            <span>OpenAPI Docs</span>
          </Link>
          <a href="/api/openapi.json" target="_blank" rel="noopener noreferrer">
            OpenAPI Spec (JSON)
          </a>
        </div>
        <div className="fcol">
          <h5>Source</h5>
          <a
            href="http://results.nith.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            results.nith.ac.in
          </a>
          <a
            href="https://nith.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            nith.ac.in
          </a>
        </div>
      </div>
      <div className="fbottom">Data: results.nith.ac.in · unofficial</div>
    </footer>
  );
}
