import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Unauthorised() {
  useEffect(() => {
    document.title = "Unauthorised - Shivam Blog";
  }, []);
  return (
    <main className="w-full flex justify-center items-center gap-6 flex-col">
      <h1 className="text-2xl font-bold text-center pt-44">You are not authorised to access this application.</h1><Link to="/" className="px-3 py-2 bg-slate-900 text-white rounded-md">Go Back</Link>
    </main>
  );
}