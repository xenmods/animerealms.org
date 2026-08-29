"use client";

import * as React from "react";
import { Settings, LogOut, LogIn, User, Check } from "lucide-react";
import { Icon } from "@iconify/react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSession, signOut } from "next-auth/react";
import { THEMES } from "@/lib/consts";

const THEME_COLORS: Record<string, string> = {
  dark: "oklch(0.922 0 0)",
  supa: "oklch(0.4365 0.1044 156.7556)",
  night: "oklch(0.7162 0.1597 290.3962)",
  twit: "oklch(0.6692 0.1607 245.011)",
  darkmatter: "oklch(0.7214 0.1337 49.9802)",
  netflix: "oklch(0.5814 0.2349 27.9869)",
  sage: "oklch(0.6333 0.0309 154.9039)",
  doom: "oklch(0.6083 0.209 27.0276)",
  rose: "oklch(0.7543 0.2319 332.0212)",
  tangerine: "oklch(0.6397 0.172 36.4421)",
  snow: "oklch(0.8445 0.0931 232.7082)",
};

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const isPageActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <Icon icon="solar:home-2-bold" className="mr-2 h-4 w-4" />
            <span>Home</span>
            {isPageActive("/") && <Check className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/discover"))}
          >
            <Icon
              icon="solar:star-fall-minimalistic-2-bold"
              className="mr-2 h-4 w-4"
            />
            <span>Discover</span>
            {isPageActive("/discover") && <Check className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/visions"))}
          >
            <Icon
              icon="solar:clapperboard-text-bold"
              className="mr-2 h-4 w-4"
            />
            <span>Visions</span>
            {isPageActive("/visions") && <Check className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/schedule"))}
          >
            <Icon icon="solar:calendar-bold" className="mr-2 h-4 w-4" />
            <span>Schedule</span>
            {isPageActive("/schedule") && <Check className="ml-auto h-4 w-4" />}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          {Object.entries(THEMES).map(([key, label]) => (
            <CommandItem
              key={key}
              onSelect={() => runCommand(() => setTheme(key))}
            >
              <div className="mr-2 flex items-center justify-center w-4 h-4">
                <div
                  className="w-3 h-3 rounded-full border border-muted-foreground/20"
                  style={{
                    backgroundColor: THEME_COLORS[key] || "currentColor",
                  }}
                />
              </div>
              <span>{label}</span>
              {theme === key && <Check className="ml-auto h-4 w-4" />}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {session ? (
            <>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/user"))}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/settings"))}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => signOut({ callbackUrl: "/en" }))}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </CommandItem>

            </>
          ) : (
            <>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/settings"))}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push("/login"))}
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>Log in</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
