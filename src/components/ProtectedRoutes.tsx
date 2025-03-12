import React from "react";
import { useAuth } from "@/components/AuthContext";
import { Navigate } from "react-router-dom";
import Loading from "./Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PR: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default PR;
