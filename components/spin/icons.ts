import {
  CalendarClock,
  ChartCandlestick,
  FileText,
  GraduationCap,
  RotateCcw,
  Shirt,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";

import type { IconKey } from "@/lib/prizes";

// Named imports only, so unused Lucide icons are tree-shaken.
export const PRIZE_ICONS: Record<IconKey, LucideIcon> = {
  report: FileText,
  session: Users,
  charts: ChartCandlestick,
  masterclass: GraduationCap,
  merch: Shirt,
  calendar: CalendarClock,
  retry: RotateCcw,
  webinar: Video,
};
