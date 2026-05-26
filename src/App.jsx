import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ConstructionApp from "./ConstructionApp";
import DemoApp from "./demo/DemoApp";
import AdminLogin from "./admin/AdminLogin";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import { hasAdminSession } from "./admin/adminAuth";
import Mapas from "./Mapas";
import NavMap from "./NavMap";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConstructionApp />} />
        <Route path="/demo" element={<DemoApp />} />
        <Route path="/mapas" element={<Mapas />} />
        <Route path="/navmap" element={<NavMap />} />
        <Route path="/admin" element={hasAdminSession() ? <Navigate to="/admin/panel" replace /> : <AdminLogin />} />
        <Route
          path="/admin/panel"
          element={
            <AdminProtectedRoute>
              <AdminLogin initialView="dashboard" />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
