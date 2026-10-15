// Every English dashboard string lives here so feature 4 can swap in EN/FR
// translations without touching the shell. Navigation items, teams, and search
// are Tailwind Plus placeholders until the features behind them exist.
export const DashboardMessages = {
  title: "Dashboard",
  navigation: {
    dashboard: "Dashboard",
    team: "Team",
    projects: "Projects",
    calendar: "Calendar",
    documents: "Documents",
    reports: "Reports",
  },
  teamsHeading: "Your teams",
  teams: {
    heroicons: "Heroicons",
    tailwindLabs: "Tailwind Labs",
    workcation: "Workcation",
  },
  settings: "Settings",
  search: "Search",
  openSidebar: "Open sidebar",
  closeSidebar: "Close sidebar",
  viewNotifications: "View notifications",
  openUserMenu: "Open user menu",
  yourProfile: "Your profile",
  signOut: "Sign out",
} as const;
