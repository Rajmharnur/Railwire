import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  Command,
  Eye,
  FileSpreadsheet,
  Layers3,
  Radio,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Train,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "lime" | "cyan" | "amber" | "red" | "emerald" | "crimson" | "violet";
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function RailLayout({
  children,
  pageTitle,
  pageSubtitle,
  currentBreadcrumb = "Command Center",
  actions,
}: {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  currentBreadcrumb?: string;
  actions?: ReactNode;
}) {
  const [location, setLocation] = useLocation();

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST";
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: false }) + " IST");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modals & Panels
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedsModal, setShowFeedsModal] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");

  // Quick Toggles
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [autoSanctionSandbox, setAutoSanctionSandbox] = useState(true);

  // Settings State
  const [headwayBuffer, setHeadwayBuffer] = useState(20);
  const [division, setDivision] = useState("Agra (NCR)");
  const [maxSolveTime, setMaxSolveTime] = useState(10);

  // Notification items
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "Optimization Plan v2 Ready",
      detail: "Pooled P-Way and S&T tasks on C-07. 130 min downtime saved.",
      time: "12:07 IST",
      unread: true,
      tone: "lime",
    },
    {
      id: "n2",
      title: "USFD Flaw Detected",
      detail: "KM 184.2 requires inspection before 20:00. High priority.",
      time: "12:04 IST",
      unread: true,
      tone: "amber",
    },
    {
      id: "n3",
      title: "Gatimaan Express #12056 Clear",
      detail: "Headway buffer confirmed at 25 minutes.",
      time: "11:58 IST",
      unread: false,
      tone: "cyan",
    },
  ]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
        setShowNotifications(false);
        setShowSettings(false);
        setShowFeedsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { href: "/", label: "Command Center", icon: Activity, badge: "LIVE" },
    { href: "/corridors", label: "Corridors Map", icon: Route },
    { href: "/work-orders", label: "Work Orders & ML", icon: Layers3, count: "24" },
    { href: "/analytics", label: "Solver Benchmark", icon: BarChart3, badge: "20-COR" },
    { href: "/scenarios", label: "What-If Sandbox", icon: SlidersHorizontal },
    { href: "/coa-sanction", label: "COA Sanction Memo", icon: FileSpreadsheet },
  ];

  const paletteActions = [
    { label: "Go to Master Command Center", path: "/", icon: Activity, category: "Navigation" },
    { label: "Open Corridors Topology Map", path: "/corridors", icon: Route, category: "Navigation" },
    { label: "View Work Orders & ML Scoring", path: "/work-orders", icon: Layers3, category: "Navigation" },
    { label: "Run 20-Corridor 200-Task Benchmark", path: "/analytics", icon: BarChart3, category: "Navigation" },
    { label: "Open What-If Scenario Sandbox", path: "/scenarios", icon: SlidersHorizontal, category: "Navigation" },
    { label: "Generate Official COA Sanction Memo", path: "/coa-sanction", icon: FileSpreadsheet, category: "Navigation" },
  ];

  const filteredPalette = paletteActions.filter((a) =>
    a.label.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="rail-app">
      <aside className="rail-sidebar">
        <Link href="/">
          <div className="brand cursor-pointer">
            <div className="brand-mark">
              <Route size={19} strokeWidth={2.5} />
            </div>
            <div>
              <div className="brand-name">
                RAILBLOCK<span>AI</span>
              </div>
              <div className="brand-sub">OPERATIONS CONTROL</div>
            </div>
          </div>
        </Link>

        <div className="sidebar-section">
          <p className="sidebar-label">Workspace</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  type="button"
                  className={`nav-item ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.badge && <span className="nav-live">{item.badge}</span>}
                  {item.count && <span className="nav-count">{item.count}</span>}
                </button>
              </Link>
            );
          })}
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">Feeds & Telemetry</p>
          <div
            className="nav-item cursor-pointer text-xs"
            onClick={() => setShowFeedsModal(true)}
          >
            <Zap size={16} className="text-[#b9f227]" />
            <span>Telemetry Feeds</span>
            <span className="status-dot" />
          </div>
        </div>

        <div className="sidebar-spacer" />

        <div className="system-card">
          <div className="flex items-center justify-between">
            <span className="eyebrow">SOLVER HEALTH</span>
            <span className="health-dot" />
          </div>
          <div className="health-line">
            <span>CP-SAT Engine</span>
            <b>ACTIVE (1.82s)</b>
          </div>
          <div className="health-line">
            <span>Feeds Synced</span>
            <b>3 / 3 LIVE</b>
          </div>
          <div className="health-line">
            <span>SLA Compliance</span>
            <b className="text-[#b9f227]">100% CRITICAL</b>
          </div>
        </div>

        <div className="user-strip">
          <div className="avatar">AK</div>
          <div>
            <div className="user-name">A. Krishnan</div>
            <div className="user-role">Chief Controller · NCR</div>
          </div>
          <button
            type="button"
            className="icon-button ml-auto"
            aria-label="Open settings"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 size={16} />
          </button>
        </div>
      </aside>

      <main className={`rail-main ${highContrast ? "high-contrast-mode" : ""}`}>
        {/* Stitch Mission Control Top Status Bar */}
        <div className="mission-bar">
          <div className="mission-section">
            <div className="mission-clock">
              <span className="beacon-dot" />
              <span>{currentTime}</span>
            </div>
            <span className="text-[#283952]">|</span>
            <div className="mission-chip emerald">
              <Train size={12} className="text-[#10b981]" />
              <span>12050 GATIMAAN</span>
              <strong>158 KM/H</strong>
              <span className="text-[#10b981] font-bold">● RT</span>
            </div>
            <div className="mission-chip cyan">
              <Train size={12} className="text-[#22d3ee]" />
              <span>12952 RAJDHANI</span>
              <strong>129 KM/H</strong>
              <span className="text-[#22d3ee]">CLEAR</span>
            </div>
            <div className="mission-chip">
              <Zap size={12} className="text-[#06b6d4]" />
              <span>WESTERN DFC</span>
              <strong>25.4 kV NOMINAL</strong>
              <span className="text-[#10b981]">98.4%</span>
            </div>
          </div>

          <div className="mission-section">
            <button
              type="button"
              className="text-[10px] flex items-center gap-1.5 px-2 py-1 rounded bg-[#0d1527] border border-[#1a2538] hover:border-[#06b6d4] text-[#8ea4c2] transition-colors"
              onClick={() => {
                const next = !soundAlerts;
                setSoundAlerts(next);
                toast(next ? "Operational Audio Alerts: ENABLED" : "Operational Audio Alerts: MUTED");
              }}
              title="Toggle Audio Warnings"
            >
              {soundAlerts ? <Volume2 size={12} className="text-[#10b981]" /> : <VolumeX size={12} className="text-[#f87171]" />}
              <span>{soundAlerts ? "AUDIO ON" : "MUTED"}</span>
            </button>

            <button
              type="button"
              className="text-[10px] flex items-center gap-1.5 px-2 py-1 rounded bg-[#0d1527] border border-[#1a2538] hover:border-[#06b6d4] text-[#8ea4c2] transition-colors"
              onClick={() => {
                const next = !highContrast;
                setHighContrast(next);
                toast(next ? "High-Contrast Cockpit Mode: ACTIVATED" : "Standard Ops Display: RESTORED");
              }}
              title="Toggle High Contrast Tactical Display"
            >
              <Eye size={12} className={highContrast ? "text-[#22d3ee]" : "text-[#647b99]"} />
              <span>{highContrast ? "HIGH-CONTRAST" : "COCKPIT"}</span>
            </button>

            <div className="mission-chip cyan">
              <ShieldCheck size={12} className="text-[#22d3ee]" />
              <span>COA AUTO-SANCTION</span>
              <strong className="text-[#10b981]">ACTIVE</strong>
            </div>
          </div>
        </div>

        <header className="topbar">
          <div className="breadcrumb">
            <span className="muted">Operations</span>
            <span>/</span>
            <strong>{currentBreadcrumb}</strong>
            <Pill tone="lime">
              <span className="live-pulse" /> Real-time
            </Pill>
          </div>
          <div className="top-actions">
            <div className="sync-status">
              <span className="sync-dot" /> Live Indian Railways Telemetry{" "}
              <span className="muted">· Delhi-Agra Sector</span>
            </div>
            <button
              type="button"
              className="icon-button relative"
              aria-label="View alerts"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell size={17} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Open command palette"
              onClick={() => setShowCommandPalette(true)}
            >
              <Command size={17} />
            </button>
            <div
              className="top-avatar cursor-pointer"
              onClick={() => setShowSettings(true)}
              title="Chief Controller Profile"
            >
              AK
            </div>
          </div>
        </header>

        <div className="page-wrap">
          {(pageTitle || actions) && (
            <section className="page-heading">
              <div>
                <div className="eyebrow accent-eyebrow">
                  MONDAY · 05 SEP 2026 / 12:08 IST · DIVISIONAL CONTROL
                </div>
                {pageTitle && <h1>{pageTitle}</h1>}
                {pageSubtitle && <p>{pageSubtitle}</p>}
              </div>
              {actions && <div className="heading-actions">{actions}</div>}
            </section>
          )}

          {children}
        </div>
      </main>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center pt-24 p-4 backdrop-blur-sm">
          <div className="bg-[#11191c] border border-[#2b3b40] rounded-xl max-w-xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-3 px-3 py-2 bg-[#0d1417] rounded-lg border border-[#202c31]">
              <Search size={16} className="text-[#718188]" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or navigate (e.g., Benchmark, Work Orders, Corridors)..."
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                className="bg-transparent border-0 text-sm text-[#e7eef0] focus:outline-none w-full"
              />
              <span className="text-[10px] font-mono text-[#718188] border border-[#24343a] px-1.5 py-0.5 rounded">
                ESC
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {filteredPalette.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setLocation(item.path);
                      setShowCommandPalette(false);
                      setPaletteQuery("");
                    }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#18262b] cursor-pointer transition-all text-xs font-mono text-[#e7eef0]"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-[#b9f227]" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] text-[#718188] uppercase">{item.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="fixed top-16 right-8 z-50 w-80 bg-[#11191c] border border-[#28373d] rounded-xl shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#202c31] pb-2">
            <strong className="text-xs font-mono uppercase text-[#e7eef0] flex items-center gap-2">
              <Bell size={14} className="text-[#b9f227]" /> Operational Alerts
            </strong>
            <button
              onClick={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                toast.success("All alerts marked as read");
              }}
              className="text-[10px] font-mono text-[#b9f227] hover:underline"
            >
              Mark read
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded border text-xs ${
                  n.unread
                    ? "border-[#b9f227]/30 bg-[#142018]"
                    : "border-[#202c31] bg-[#0d1417] opacity-75"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-[#e7eef0] text-[11px]">{n.title}</strong>
                  <span className="text-[9px] font-mono text-[#718188]">{n.time}</span>
                </div>
                <p className="text-[11px] text-[#93a4aa] leading-relaxed">{n.detail}</p>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-[#202c31] text-center">
            <button
              onClick={() => setShowNotifications(false)}
              className="text-[11px] font-mono text-[#718188] hover:text-[#e7eef0]"
            >
              Close Alerts
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#11191c] border border-[#2b3b40] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202c31]">
              <div className="flex items-center gap-2 text-[#f0f6f5] font-bold">
                <Settings2 size={18} className="text-[#b9f227]" />
                <h3>RailBlock Solver Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#718188] hover:text-[#e7eef0] font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[#718188] mb-1">OPERATIONAL DIVISION</label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="w-full bg-[#0e1619] border border-[#25363e] rounded p-2 text-[#e7eef0]"
                >
                  <option value="Agra (NCR)">Agra (North Central Railway)</option>
                  <option value="Delhi (NR)">Delhi (Northern Railway)</option>
                  <option value="Prayagraj (NCR)">Prayagraj (North Central Railway)</option>
                  <option value="Mumbai (CR)">Mumbai (Central Railway)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[#718188] mb-1">
                  <span>HEADWAY SAFETY BUFFER:</span>
                  <strong className="text-[#b9f227]">{headwayBuffer} Minutes</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  value={headwayBuffer}
                  onChange={(e) => setHeadwayBuffer(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#718188] mb-1">
                  <span>MAX SOLVER TIME LIMIT:</span>
                  <strong className="text-[#6ee7f9]">{maxSolveTime} Seconds</strong>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={maxSolveTime}
                  onChange={(e) => setMaxSolveTime(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded bg-[#0d1417] border border-[#1e2a2f]">
                <span>Emergency Alarm Sound</span>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="accent-[#b9f227] w-4 h-4"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#202c31]">
              <button
                type="button"
                onClick={() => {
                  setShowSettings(false);
                  toast.success("Settings saved successfully");
                }}
                className="primary-button"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Feeds Modal */}
      {showFeedsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#11191c] border border-[#2b3b40] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202c31]">
              <div className="flex items-center gap-2 text-[#f0f6f5] font-bold">
                <Zap size={18} className="text-[#b9f227]" />
                <h3>Live Telemetry Gateway Status</h3>
              </div>
              <button
                onClick={() => setShowFeedsModal(false)}
                className="text-[#718188] hover:text-[#e7eef0] font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f] flex items-center justify-between">
                <div>
                  <strong className="text-[#e7eef0] block">SMMS Feed (P-Way)</strong>
                  <span className="text-[10px] text-[#718188]">Track Management & USFD</span>
                </div>
                <Pill tone="lime">ONLINE</Pill>
              </div>

              <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f] flex items-center justify-between">
                <div>
                  <strong className="text-[#e7eef0] block">TMS Feed (S&T)</strong>
                  <span className="text-[10px] text-[#718188]">Signalling & Axle Counters</span>
                </div>
                <Pill tone="lime">ONLINE</Pill>
              </div>

              <div className="p-3 rounded bg-[#0d1417] border border-[#1e2a2f] flex items-center justify-between">
                <div>
                  <strong className="text-[#e7eef0] block">TDMS Feed (TRD)</strong>
                  <span className="text-[10px] text-[#718188]">Traction & OHE Sensors</span>
                </div>
                <Pill tone="lime">ONLINE</Pill>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#202c31]">
              <button
                type="button"
                onClick={() => setShowFeedsModal(false)}
                className="secondary-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
