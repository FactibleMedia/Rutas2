import { Navigate, useLocation } from "react-router-dom";
import { hasAdminSession } from "./adminAuth";

export default function AdminProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasAdminSession()) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }

  return children;
}
