import { Topbar, Footer } from "../../components/SiteShell";

export default function LoadingResult() {
  return (
    <main className="wrap" aria-busy="true">
      <Topbar />

      <div style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
        <div
          className="skel"
          style={{ width: "180px", height: "20px", borderRadius: "6px" }}
        />
      </div>

      <div
        className="profile"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          padding: "1.4rem",
        }}
      >
        <div
          className="skel"
          style={{ width: "260px", height: "32px", borderRadius: "8px" }}
        />
        <div
          className="skel"
          style={{ width: "200px", height: "18px", borderRadius: "6px" }}
        />
        <div
          style={{
            display: "flex",
            gap: "0.6rem",
            marginTop: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <div
            className="skel"
            style={{ width: "120px", height: "42px", borderRadius: "8px" }}
          />
          <div
            className="skel"
            style={{ width: "120px", height: "42px", borderRadius: "8px" }}
          />
          <div
            className="skel"
            style={{ width: "120px", height: "42px", borderRadius: "8px" }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.6rem",
          margin: "1.75rem 0 1.25rem",
        }}
      >
        <div
          className="skel"
          style={{ width: "130px", height: "40px", borderRadius: "10px" }}
        />
        <div
          className="skel"
          style={{ width: "100px", height: "40px", borderRadius: "10px" }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skel card" style={{ height: "240px" }} />
        ))}
      </div>

      <Footer />
    </main>
  );
}
