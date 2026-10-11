import {
  ClipboardList,
  Factory,
  Gauge,
  Hammer,
  History,
  Home,
  LayoutDashboard,
  type LucideIcon,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Warehouse,
  Wrench,
  FileBarChart,
  Settings,
  AlertTriangle,
} from "lucide-react";
import type { AccessArea } from "@wps/contracts";

export interface NavChild {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  area?: AccessArea;
  match?: string;
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home, area: "HOME" },
  { label: "Sales & Orders", href: "/sales-orders", icon: ShoppingCart, area: "SALES_ORDERS" },
  { label: "SPK / Work Order", href: "/work-orders", icon: ClipboardList, area: "WORK_ORDER" },
  { label: "Planning", href: "/planning", icon: Gauge, area: "PLANNING" },
  { label: "Procurement", href: "/procurement", icon: PackageSearch, area: "PROCUREMENT" },
  { label: "Receiving / PBB", href: "/receiving", icon: Truck, area: "RECEIVING_PBB" },
  { label: "Sawmill & ST", href: "/sawmill", icon: Hammer, area: "SAWMILL_ST" },
  { label: "Vacuum / KD", href: "/vacuum-kd", icon: Sparkles, area: "VACUUM_KD" },
  { label: "Production", href: "/production", icon: Factory, area: "PRODUCTION" },
  { label: "Quality", href: "/quality", icon: ShieldCheck, area: "QUALITY" },
  { label: "Stock & Allocation", href: "/stock", icon: Warehouse, area: "STOCK_ALLOCATION" },
  { label: "Packing & Shipping", href: "/packing-shipping", icon: PackageSearch, area: "PACKING_SHIPPING" },
  { label: "Traceability", href: "/traceability", icon: History, area: "TRACEABILITY" },
  { label: "Nyangkut / Rework", href: "/nyangkut", icon: AlertTriangle, area: "NYANGKUT_REWORK" },
  { label: "Legacy Production Dummy", href: "/legacy-production", icon: Wrench, area: "LEGACY_PRODUCTION_DUMMY" },
  { label: "Dashboards", href: "/dashboards", icon: LayoutDashboard, area: "DASHBOARDS" },
  { label: "Reports", href: "/reports", icon: FileBarChart, area: "REPORTS" },
  { label: "Settings", href: "/settings", icon: Settings, area: "SETTINGS" },
];
