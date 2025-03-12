import { useEffect, useState } from "react";
import { CheckCircle2Icon } from "lucide-react";

interface FormSuccessProps {
  message?: string;
}

export const SuccessToast = ({ message }: FormSuccessProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2000);

      return () => clearTimeout(timer); // Cleanup the timer if the component unmounts or message changes
    }
  }, [message]);

  if (!message || !isVisible) return null;

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 mt-4 bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center gap-x-2 rounded-md p-3 text-sm font-medium shadow-lg z-50">
      <CheckCircle2Icon className="h-4 w-4" />
      <p>{message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="ml-auto text-emerald-600 font-bold"
      >
        ✕
      </button>
    </div>
  );
};
