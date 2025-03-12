import { Route, Routes } from "react-router-dom";
import PR from "./components/ProtectedRoutes";
import Home from "./pages/Home";
import CreatePost from "./pages/Write";
import Dashboard from "./pages/Dashboard";
import Unauthorised from "./pages/Unauthorised";
import { Toaster } from "./components/ui/toaster";
import EditPage from "./pages/Edit";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/unauthorised" element={<Unauthorised />} />
        <Route
          path="/write"
          element={
            <PR>
              <CreatePost />
            </PR>
          }
        />
        <Route
          path="/edit/:slug"
          element={
            <PR>
              <EditPage />
            </PR>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PR>
              <Dashboard />
            </PR>
          }
        />
        <Route path="*" element={<h1>Not Found</h1>} />
      </Routes>
      <Toaster />
    </>
  );
}
