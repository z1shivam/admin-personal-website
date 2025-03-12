import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { auth } from "@/firebaseConfig";
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();


  const logoutUser = async () => {
    setLoggingOut(true);
    await auth.signOut().then(() => {
      navigate("/");
    });
    setLoggingOut(false);
  };

  const isDashboard = location.pathname === "/dashboard";
  const isWrite = location.pathname === "/write";
  const isEdit = location.pathname.includes("/edit");

  return (
    <header className="w-full h-16 bg-slate-100 border-b-2 border-slate-300">
      <div className="mx-auto max-w-7xl flex justify-between items-center px-4 h-full ">
        <h2 className="text-2xl text-slate-900 font-bold hidden md:block w-full">
          Hi, {user?.displayName}
        </h2>
        <p
          className="text-sm font-medium text-center hidden md:block w-full select-none"
          title={user?.email || "user email"}
        >
          {user?.email}
        </p>
        <div className="flex gap-5 justify-between md:justify-end w-full">
          <img
            src={user?.photoURL || ""}
            title={user?.displayName || "user profile photo"}
            alt="user profile photo"
            className="w-10 aspect-square rounded-full"
          />
          <div className="flex gap-5">
            <Button onClick={logoutUser} variant={"destructive"} disabled={loggingOut}>
              {loggingOut && <AiOutlineLoading3Quarters className="size-4 animate-spin mr-2" />}
              Logout
            </Button>
            {isDashboard && (
              <Button onClick={() => navigate("/write")} disabled={loggingOut}>
                Create Post
              </Button>
            )}
            {isWrite && (
            <Button onClick={() => navigate("/dashboard")} disabled={loggingOut}>
              Dashboard
            </Button>
          )}
            {isEdit && (
            <Button onClick={() => navigate("/dashboard")} disabled={loggingOut}>
              Dashboard
            </Button>
          )}
          </div>
          
        </div>  
      </div>
    </header>
  );
}
