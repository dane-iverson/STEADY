import React from "react";
import { Bell, BookOpen, Droplet, ShieldAlert, TrendingUp } from "lucide-react";

export function NavBar({ screen, setScreen }) {
  const items = [
    { id: "dashboard", label: "Today", icon: Droplet },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "reminders", label: "Plan", icon: Bell },
    { id: "education", label: "Learn", icon: BookOpen },
    { id: "emergency", label: "Help", icon: ShieldAlert },
  ];

  return (
    <nav className="navbar">
      {items.map((it) => {
        const Icon = it.icon;
        const active = screen === it.id;
        return (
          <button
            key={it.id}
            className={"navItem" + (active ? " navItemActive" : "")}
            onClick={() => setScreen(it.id)}
            aria-label={it.label}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
