export default function Loading() {
  return (
    <main className="wrap" aria-busy="true">
      <div className="skel nav" />
      <div className="skel hero" />
      <div className="skel search" />
      <div className="rcards">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skel card" />
        ))}
      </div>
    </main>
  );
}
