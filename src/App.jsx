import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { hasAdminSession } from "./admin/adminAuth";

// Inicio is the landing route, so it stays in the initial chunk. Same for
// MaintenancePage: when VITE_MAINTENANCE_MODE is on, it effectively becomes
// the landing page for every anonymous visitor.
import InicioPage from "./inicio/InicioPage";
import MaintenancePage from "./MaintenancePage";

// When on, every public route renders the maintenance page instead of its
// normal content; /admin and /admin/panel stay reachable so the team can
// keep preparing content while the public site is gated. Toggle by setting
// VITE_MAINTENANCE_MODE=true in the environment used for the build/deploy.
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

// Everything else is split out. Mapas pulls in mapbox-gl, Glossary pulls in
// framer-motion, and admin/* is a large CRUD surface no anonymous visitor needs
// -- previously all of it shipped to every page, including the static ones.
const Mapas = lazy(() => import("./Mapas"));
const Glossary = lazy(() => import("./Glossary"));
const GalleryPage = lazy(() => import("./GalleryPage"));
const MisAportes = lazy(() => import("./MisAportes"));
const AcercaDe = lazy(() => import("./acerca de/AcercaDe"));
const TermsPage = lazy(() => import("./TermsPage"));
const TermsCookies = lazy(() => import("./TermsCookies"));
const RutasInteractivas = lazy(() => import("./rutas-interactivas/RutasInteractivas"));
const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const AdminPanel = lazy(() => import("./admin/AdminPanel"));
const AdminProtectedRoute = lazy(() => import("./admin/AdminProtectedRoute"));

function RouteFallback() {
  return <div className="route-fallback" role="status" aria-live="polite" aria-busy="true" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
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

          {MAINTENANCE_MODE ? (
            <Route path="*" element={<MaintenancePage />} />
          ) : (
            <>
              <Route path="/" element={<Navigate to="/inicio" replace />} />
              <Route path="/inicio" element={<InicioPage />} />
              <Route path="/mapas" element={<Mapas />} />
              <Route path="/glosario" element={<Glossary />} />
              <Route path="/galeria" element={<GalleryPage />} />
              <Route path="/mis-aportes" element={<MisAportes />} />
              <Route path="/acerca-de" element={<AcercaDe />} />
              <Route path="/terminos-y-condiciones" element={<TermsPage />} />
              <Route path="/terminos-de-uso-y-cookies" element={<TermsCookies />} />
              <Route path="/rutas-interactivas" element={<RutasInteractivas />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
