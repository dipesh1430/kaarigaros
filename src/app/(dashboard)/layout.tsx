import Link from "next/link";
import {
  LayoutDashboard,
  Layers,
  Users,
  Wallet,
  Receipt,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/batches", label: "Batches", icon: Layers },
  { href: "/karigars", label: "Karigars", icon: Users },
  { href: "/settlements", label: "Settlements", icon: Wallet },
  { href: "/billing", label: "Billing", icon: Receipt },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <h1 className="font-heading text-xl font-bold text-primary">
            KaarigarOS
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-muted"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-muted">
            <Settings className="h-5 w-5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
