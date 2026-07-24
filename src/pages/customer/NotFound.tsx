import { Link } from "react-router-dom";
import { useSEO } from "../../lib/useSEO";

export default function NotFound() {
  useSEO({ title: "Page Not Found", index: false });

  return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <h1 className="text-display text-6xl">404</h1>
      <p className="text-neutral-500 mt-3">Looks like this page ran out of stock.</p>
      <Link to="/" className="btn btn-primary mt-6 inline-flex">Back to Home</Link>
    </div>
  );
}
