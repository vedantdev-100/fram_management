import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Package,
  Wallet,
  CalendarDays,
  BookOpen,
  Users,
  ChartNoAxesCombined,
  FolderOpen,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  FlaskConical,
  History,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "@/features/auth";
import { FarmSwitcher } from "@/features/farms";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { API_BASE } from "@/api/client";
import { queryClient } from "@/api/queryClient";
import { Button } from "@/components/ui";
import { initials } from "@/lib/format";
import { GlobalSearch } from "./GlobalSearch";
const groups: { label: string; items: [string, string, LucideIcon][] }[] = [
  {
    label: "YOUR FARM",
    items: [
      ["/", "Overview", LayoutDashboard],
      ["/land", "Field plan", Map],
      ["/events", "Farm work", ClipboardList],
      ["/assets", "Inventory & assets", Package],
      ["/ledger", "Money", Wallet],
      ["/reports", "Farm insights", ChartNoAxesCombined],
    ],
  },
  {
    label: "PLANNING & RECORDS",
    items: [
      ["/crop-science", "Crop plans", CalendarDays],
      ["/scheduling", "Availability", CalendarDays],
      ["/workbench", "Planning desk", BookOpen],
      ["/costing", "Costs & value", ChartNoAxesCombined],
      ["/compliance", "Treatment register", ShieldCheck],
      ["/files", "Documents", FolderOpen],
    ],
  },
  {
    label: "WORKSPACE",
    items: [
      ["/catalogue", "Farm catalogue", FlaskConical],
      ["/settings", "Team & settings", Users],
      ["/audit", "Activity log", History],
      ["/sync", "Offline sync", ArrowUpRight],
    ],
  },
];
export function Shell() {
  const user = useSession((s) => s.user);
  const mode = useSession((s) => s.mode);
  const open = useWorkspace((s) => s.sidebarOpen);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  useEffect(() => {
    useWorkspace.getState().setSidebar(false);
    setMenu(false);
  }, [location.pathname]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") {
        useWorkspace.getState().setSidebar(false);
        setMenu(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    const aside = document.getElementById("main-navigation")!;
    const focusable = () =>
      Array.from(aside.querySelectorAll<HTMLElement>("button,a,select")).filter(
        (e) => !e.hasAttribute("disabled") && e.offsetParent !== null,
      );
    focusable()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = focusable(),
        first = els[0],
        last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [open]);
  async function signOut() {
    setLoggingOut(true);
    const { accessToken, refreshToken } = useSession.getState();
    try {
      if (mode === "live" && refreshToken)
        await fetch(API_BASE + "/auth/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + accessToken,
          },
          body: JSON.stringify({ refresh: refreshToken }),
          signal: AbortSignal.timeout(3500),
        });
    } catch {
      /* Local session always ends even when the backend is unavailable. */
    } finally {
      queryClient.clear();
      useWorkspace.getState().setFarm(null);
      useSession.getState().clear();
    }
  }
  const page =
    groups
      .flatMap((g) => g.items)
      .find((i) => i[0] === location.pathname)?.[1] || "Farm workspace";
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => useWorkspace.getState().setSidebar(false)}
        />
      )}
      <aside
        id="main-navigation"
        className={"sidebar " + (open ? "sidebar-open" : "")}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <Link to="/" aria-label="Fieldwork overview">
            <Brand />
          </Link>
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => useWorkspace.getState().setSidebar(false)}
          >
            <X size={20} />
          </button>
        </div>
        <FarmSwitcher />
        <nav>
          {groups.map((g) => (
            <div className="nav-group" key={g.label}>
              <span className="nav-group-label">{g.label}</span>
              {g.items.map(([path, label, Icon]) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === "/"}
                  className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-hint">
            <span className="hint-dot" />
            <span>
              {mode === "demo" ? "Preview workspace" : "Live farm workspace"}
            </span>
          </div>
          <Link to="/settings" className="sidebar-settings">
            <Settings size={16} />
            Workspace preferences
          </Link>
        </div>
      </aside>
      <div className="main-shell" inert={open}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => useWorkspace.getState().setSidebar(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{page}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <button
              className="header-search"
              onClick={() => setSearch(true)}
              aria-label="Search your farm"
            >
              <Search size={17} />
              <span>Search your farm</span>
              <kbd>⌘ K</kbd>
            </button>
            <Link
              className="icon-button"
              to="/notifications"
              aria-label="Open inbox"
            >
              <Bell size={19} />
            </Link>
            <div className="user-menu-wrap">
              <button
                className="user-trigger"
                aria-label="Open user menu"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                <span className="avatar">
                  {initials(user?.full_name || "Farm user")}
                </span>
                <ChevronDown size={14} />
              </button>
              {menu && (
                <div className="user-menu">
                  <strong>{user?.full_name}</strong>
                  <small>{user?.email}</small>
                  <Link to="/settings">
                    <Settings size={16} />
                    Team & settings
                  </Link>
                  <button disabled={loggingOut} onClick={signOut}>
                    <LogOut size={16} />
                    {loggingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {mode === "demo" && (
          <div className="demo-banner">
            <span>
              <span className="hint-dot" />
              Preview data · explore the workspace without changing real farm
              records.
            </span>
            <Button variant="ghost" onClick={signOut}>
              Connect your backend
              <ArrowUpRight size={14} />
            </Button>
          </div>
        )}
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>Fieldwork · One farm, a clearer picture.</span>
          <span>Record the work. Learn from the season.</span>
        </footer>
      </div>
      {search && <GlobalSearch onClose={() => setSearch(false)} />}
    </div>
  );
}
