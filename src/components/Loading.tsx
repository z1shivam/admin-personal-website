import { FaSpinner } from "react-icons/fa";

export default function Loading() {
  return (
    <main className="w-full h-screen flex justify-center items-center">
      <p className="flex gap-4 items-center justify-center">
        <span>
          <FaSpinner className="size-5 animate-spin" />
        </span>
        Loading...
      </p>
    </main>
  );
}