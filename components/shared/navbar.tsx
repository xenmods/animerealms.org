"use client";

import { useTransition } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LANGUAGES, THEMES } from "@/lib/consts";
import { signIn, signOut, useSession } from "next-auth/react";
// import { flushSync } from "react-dom"; // Removed
import { NotificationDialog } from "./notification-dialog";
import { useThemeTransition } from "@/components/shared/theme-transition";
import { AnilistStatus } from "./anilist-status";

type NavItem = { label: string; href: string };

function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-primary transition-colors duration-200 uppercase p-0 rounded-none cursor-pointer hover:bg-transparent"
        >
          {locale}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.entries(LANGUAGES).map(([key, label]) => (
          <DropdownMenuItem key={key} onSelect={() => onSelectChange(key)}>
            {label} {locale === key ? "✓" : ""}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Navbar({
  setSearch,
}: {
  setSearch?: (value: string) => void;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("Navbar");
  const tShared = useTranslations("Shared");

  const { changeTheme } = useThemeTransition();

  const onThemeChange = (key: string) => {
    changeTheme(key);
  };

  return (
    <>
      <AnilistStatus />
      <div className="top-2 z-50 flex justify-between items-center pt-2 mt-4 px-4 sm:px-10 gap-4 w-full">
        {/* left: logo (current highlighted) */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={() => {
              if (setSearch) {
                setSearch("");
              }
            }}
            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
          >
            <img src="/traced-logo.png" alt="Logo" className="h-10 w-10" />
          </Link>
          <NotificationDialog />
          {/* Conditional Navigation Icon */}
          {/* Hamburger Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative px-2 py-1 rounded-full active:scale-95 transition-all ease-in-out duration-200 bg-muted text-muted-foreground hover:text-foreground"
              >
                <Icon icon="solar:hamburger-menu-linear" className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link
                  href={pathname.includes("/discover") ? "/" : "/discover"}
                  className="w-full cursor-pointer"
                >
                  <Icon
                    icon={
                      pathname.includes("/discover")
                        ? "solar:magnifer-linear"
                        : "solar:star-fall-minimalistic-2-bold"
                    }
                    className="mr-2 h-4 w-4"
                  />
                  <span>
                    {pathname.includes("/discover") ? "Home" : "Discover"}
                  </span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/visions" className="w-full cursor-pointer">
                  <Icon
                    icon="solar:clapperboard-text-bold"
                    className="mr-2 h-4 w-4"
                  />
                  <span>Visions</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/downloads" className="w-full cursor-pointer">
                  <Icon
                    icon="solar:download-minimalistic-bold"
                    className="mr-2 h-4 w-4"
                  />
                  <span>Downloads</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>


        {/* middle: nav (commented out) */}
        {/* ... */}

        {/* right: settings + social icons */}
        <div className="flex items-center gap-3 border rounded-full px-2 py-1 bg-accent/60">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-muted-foreground hover:text-primary transition-colors duration-200 p-0  rounded-none cursor-pointer"
              >
                <Icon icon="solar:sun-broken" className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(THEMES).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => {
                    onThemeChange(key);
                  }}
                >
                  <span className={`${theme === key ? "text-primary" : ""}`}>
                    {label}
                  </span>
                  <span>
                    {theme === key ? (
                      <Icon icon="solar:check-read-bold" className="size-4 text-primary" />
                    ) : null}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="w-px h-6 bg-border" />
          <LanguageSwitcher />
          <div className="w-px h-6 bg-border" />
          {/* login */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="outline-none focus:outline-none rounded-full p-0.5 hover:ring-2 hover:ring-primary/40 transition-all flex items-center justify-center cursor-pointer"
              >
                <img
                  src={session?.user?.image?.large || "/cat.jpg"}
                  alt={session?.user?.name?.slice(0, 1) || "U"}
                  className="w-6 h-6 rounded-full border border-primary/30 bg-muted-foreground object-cover"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>

              {session?.user?.name === "xen" && (
                <DropdownMenuItem
                  onSelect={() => {
                    router.push("/admin");
                  }}
                >
                  {t("admin")}
                </DropdownMenuItem>
              )}
              {session?.user?.name && (
                <DropdownMenuItem
                  onSelect={() => {
                    router.push(`/user/${session.user.name}`);
                  }}
                >
                  Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  router.push("/downloads");
                }}
              >
                Downloads
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  router.push("/settings");
                }}
              >
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant={session?.user ? "destructive" : "default"}
                onSelect={() => {
                  session?.user ? signOut({ callbackUrl: "/en" }) : router.push("/login");
                }}
              >
                {session?.user ? tShared("signOut") : tShared("signIn")}
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>

  );
}
