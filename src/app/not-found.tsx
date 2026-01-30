export default function NotFound() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Sivua ei löytynyt</h1>
      <p>Osoite on väärä tai sivu on poistettu.</p>
      <a href="/" style={{ textDecoration: "underline" }}>Etusivulle</a>
    </main>
  );
}