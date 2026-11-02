import { lazy, Suspense, useEffect, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import { apiRequest, refreshSession } from "@/api/client";
import { useSession } from "@/stores/session";
import type { User } from "@/types";
import { FarmGate } from "@/features/farms";
import { Shell } from "@/components/layout/Shell";
import { Spinner, Toasts, ErrorBox, Button } from "@/components/ui";
const Auth = lazy(() => import("@/features/auth"));
const Reset = lazy(() =>
  import("@/features/auth").then((module) => ({ default: module.ResetPage })),
);
const Dashboard = lazy(() => import("@/features/dashboard"));
const modules = {
  land: lazy(() => import("@/features/land")),
  assets: lazy(() => import("@/features/assets")),
  events: lazy(() => import("@/features/events")),
  "crop-science": lazy(() => import("@/features/crop-science")),
  scheduling: lazy(() => import("@/features/scheduling")),
  ledger: lazy(() => import("@/features/ledger")),
  costing: lazy(() => import("@/features/costing")),
  compliance: lazy(() => import("@/features/compliance")),
  workbench: lazy(() => import("@/features/workbench")),
  catalogue: lazy(() => import("@/features/catalogue")),
  files: lazy(() => import("@/features/files")),
  notifications: lazy(() => import("@/features/notifications")),
  audit: lazy(() => import("@/features/audit")),
  settings: lazy(() => import("@/features/settings")),
  reports: lazy(() => import("@/features/reports")),
  sync: lazy(() => import("@/features/sync")),
};
function Bootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    let current = true;
    const init = async () => {
      const s = useSession.getState();
      if (s.mode === "demo" && s.user) {
        s.setReady(true);
        return;
      }
      if (s.refreshToken && (await refreshSession())) {
        try {
          const user = await apiRequest<User>("auth/me/");
          if (current) s.setUser(user);
        } catch {
          if (current) s.clear();
        }
      }
      if (current) useSession.getState().setReady(true);
    };
    void init();
    return () => {
      current = false;
    };
  }, []);
  return children;
}
function Protected() {
  const ready = useSession((s) => s.ready);
  const user = useSession((s) => s.user);
  const location = useLocation();
  if (!ready) return <Spinner label="Restoring your session…" />;
  if (!user)
    return (
      <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
    );
  return (
    <FarmGate>
      <Shell />
    </FarmGate>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Workspace rendering error", error, info.componentStack);
  }
  render() {
    if (this.state.error)
      return (
        <main className="standalone">
          <div>
            <ErrorBox
              error={
                new Error(
                  "This screen could not be displayed. Reload the workspace and try again.",
                )
              }
            />
            <Button onClick={() => window.location.reload()}>
              Reload workspace
            </Button>
          </div>
        </main>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Bootstrap>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/sign-in" element={<Auth />} />
                <Route path="/reset-password" element={<Reset />} />
                <Route element={<Protected />}>
                  <Route index element={<Dashboard />} />
                  {Object.entries(modules).map(([path, Page]) => (
                    <Route key={path} path={path} element={<Page />} />
                  ))}
                </Route>
                <Route
                  path="*"
                  element={
                    <div className="standalone">
                      <div>
                        <h1 className="text-3xl mb-3">
                          This page isn’t on the farm.
                        </h1>
                        <Link className="text-link" to="/">
                          Back to your workspace
                        </Link>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </Bootstrap>
          <Toasts />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
