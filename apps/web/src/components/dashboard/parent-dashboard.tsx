"use client";

import {
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { useMessages } from "@/lib/i18n/language-provider";

import { DashboardShell, type NavigationItem, type TeamItem } from "./dashboard-shell";

// The parent portal. Navigation and teams are still the Tailwind Plus
// reference's placeholders; parent content comes in later features.
export function ParentDashboard({ userName }: { userName: string }) {
  const { dashboard } = useMessages();

  const navigation: NavigationItem[] = [
    { name: dashboard.navigation.dashboard, href: "#", icon: HomeIcon, current: true },
    { name: dashboard.navigation.team, href: "#", icon: UsersIcon, current: false },
    { name: dashboard.navigation.projects, href: "#", icon: FolderIcon, current: false },
    { name: dashboard.navigation.calendar, href: "#", icon: CalendarIcon, current: false },
    {
      name: dashboard.navigation.documents,
      href: "#",
      icon: DocumentDuplicateIcon,
      current: false,
    },
    { name: dashboard.navigation.reports, href: "#", icon: ChartPieIcon, current: false },
  ];

  const teams: TeamItem[] = [
    { id: 1, name: dashboard.teams.heroicons, href: "#", initial: "H", current: false },
    { id: 2, name: dashboard.teams.tailwindLabs, href: "#", initial: "T", current: false },
    { id: 3, name: dashboard.teams.workcation, href: "#", initial: "W", current: false },
  ];

  return <DashboardShell userName={userName} navigation={navigation} teams={teams} />;
}
