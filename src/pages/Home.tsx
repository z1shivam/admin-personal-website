import { useAuth } from "@/components/AuthContext";
import { ErrorToast } from "@/components/global/ErrorToast";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { auth, provider } from "@/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { useEffect, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = "Home - Shivam Blog";
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      const data = await signInWithPopup(auth, provider);
      if (data.user.email !== "shivamk.json@gmail.com") {
        await auth.signOut();
        navigate("/unauthorised");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      setError("An error occurred during sign-in. Please try again." + error);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="w-full h-screen flex justify-center items-center flex-col gap-6">
      <h1 className="text-center font-bold text-3xl space-y-3">
        <p>Welcome!</p>
        <p>Login to Continue</p>
      </h1>
      {error && <ErrorToast message={error} />}
      <Button onClick={handleLogin}>
        <FaGoogle className="size-4 mr-2" />
        Login with Google
      </Button>
    </main>
  );
}
