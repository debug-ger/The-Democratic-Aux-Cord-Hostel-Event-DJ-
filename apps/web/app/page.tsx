"use client";

import { useState } from "react";
import GuestView from "./components/GuestView";
import HostView from "./components/HostView";
import { Users, LayoutDashboard } from "lucide-react";

export default function Home() {
  const [view, setView] = useState<"guest" | "host">("guest");

  return (
    <div className="flex flex-col h-full">
      {/* Dev Switcher - Just for demonstration */}
      <div className="absolute top-2 right-2 z-50 flex gap-2">
        <button
          onClick={() => setView("guest")}
          className={`px-3 py-1 text-xs rounded-full transition-all ${
            view === "guest" ? "bg-primary-start text-white" : "bg-surface/60 text-muted"
          }`}
        >
          <Users className="w-3 h-3 inline mr-1" />
          Guest View
        </button>
        <button
          onClick={() => setView("host")}
          className={`px-3 py-1 text-xs rounded-full transition-all ${
            view === "host" ? "bg-primary-end text-white" : "bg-surface/60 text-muted"
          }`}
        >
          <LayoutDashboard className="w-3 h-3 inline mr-1" />
          Host View
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {view === "guest" ? <GuestView /> : <HostView />}
      </div>
    </div>
  );
}
