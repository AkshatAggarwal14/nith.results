import Link from "next/link";
import { Topbar, Footer } from "./components/SiteShell";
import SearchForm from "./components/SearchForm";

export default function NotFound() {
  return (
    <main className="wrap">
      <Topbar />
      <header className="hero">
        <h1>
          Uh oh. <em>Page</em> not found.
        </h1>
        <p>
          We couldn&apos;t find what you were looking for. It might have been
          moved, deleted, or doesn&apos;t exist.
        </p>
      </header>
      <SearchForm />
        <Link
          href="/"
          className="pgbtn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            marginTop: "1.25rem",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Back to leaderboard</span>
        </Link>
      <Footer />
    </main>
  );
}
