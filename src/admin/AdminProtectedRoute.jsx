import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearAdminSession, hasAdminSession } from "./adminAuth";
import { isSupabaseReady, supabase } from "../supabaseClient";

export default function AdminProtectedRoute({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        // Sin Supabase configurado (modo offline/dev) se permite el acceso
        // para conservar el comportamiento anterior del panel.
        if (!isSupabaseReady()) {
          if (!cancelled) setHasValidSession(true);
          return;
        }

        // getUser() valida el token contra el servidor (a diferencia de
        // getSession(), que solo lee la sesión guardada localmente y puede
        // devolver un token expirado como válido).
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Sin usuario real => el flag de localStorage está obsoleto
        if (!user) {
          clearAdminSession();
          if (!cancelled) setHasValidSession(false);
        } else {
          if (!cancelled) setHasValidSession(true);
        }
      } catch {
        clearAdminSession();
        if (!cancelled) setHasValidSession(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (!hasAdminSession()) {
    return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  }

  if (checking) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--surface-container-lowest)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 40,
            opacity: 0.3,
            animation: "spin 1s linear infinite",
          }}
        >
          sync
        </span>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <Navigate
        to="/admin"
        replace
        state={{ from: location.pathname, expired: true }}
      />
    );
  }

  return children;
}
