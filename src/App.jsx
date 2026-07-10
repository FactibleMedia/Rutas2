import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DemoApp from "./demo/DemoApp";
import AdminLogin from "./admin/AdminLogin";
import AdminPanel from "./admin/AdminPanel";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import { hasAdminSession } from "./admin/adminAuth";
import Mapas from "./Mapas";
import NavMap from "./NavMap";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/demo" replace />} />
        <Route path="/demo" element={<DemoApp />} />
        <Route path="/mapas" element={<Mapas />} />
        <Route path="/navmap" element={<NavMap />} />

        {/* Admin Login */}
        <Route
          path="/admin"
          element={hasAdminSession() ? <Navigate to="/admin/panel" replace /> : <AdminLogin />}
        />

        {/* Admin Panel (protected) */}
        <Route
          path="/admin/panel/*"
          element={
            <AdminProtectedRoute>
              <AdminPanel />
            </AdminProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
