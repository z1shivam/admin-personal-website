import { useEffect, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";

interface FormErrorProps {
  message?: string;
}

export const ErrorToast = ({ message }: FormErrorProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message || !isVisible) return null;

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 bg-red-100 border-2 border-red-300 text-red-600 flex items-center gap-x-2 rounded-md p-3 text-sm font-medium shadow-lg z-50">
      <TriangleAlertIcon className="h-4 w-4" />
      <p>{message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="ml-auto text-red-600 font-bold"
      >
        ✕
      </button>
    </div>
  );
};
