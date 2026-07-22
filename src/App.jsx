import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import InicioPage from "./inicio/InicioPage";
import Glossary from "./Glossary";
import AdminLogin from "./admin/AdminLogin";
import AdminPanel from "./admin/AdminPanel";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";
import { hasAdminSession } from "./admin/adminAuth";
import Mapas from "./Mapas";

import GalleryPage from "./GalleryPage";
import Gallery2 from "./Gallery2";
import AcercaDe from "./acerca de/AcercaDe";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/mapas" element={<Mapas />} />
        <Route path="/glosario" element={<Glossary />} />
        <Route path="/galeria" element={<GalleryPage />} />
        <Route path="/galeria2" element={<Gallery2 />} />
        <Route path="/acerca-de" element={<AcercaDe />} />

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
