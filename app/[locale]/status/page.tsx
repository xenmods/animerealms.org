import StatusPageComponent from "@/components/status/status-page";
import Navbar from "@/components/shared/navbar";
import { useTranslations } from "next-intl";

export default function StatusPage() {
  const t = useTranslations("Home");

  return (
    <div className="before:border-border after:border-border relative z-10 min-h-screen snap-start before:absolute before:top-0 before:left-0 before:h-full before:w-5 before:border-r before:bg-[linear-gradient(-135deg,_var(--color-border)_25%,_transparent_25%,_transparent_50%,_var(--color-border)_50%,_var(--color-border)_75%,_transparent_75%,_transparent)] before:bg-[length:5px_5px] after:absolute after:top-0 after:right-0 after:h-full after:w-5 after:border-l after:bg-[linear-gradient(135deg,_var(--color-border)_25%,_transparent_25%,_transparent_50%,_var(--color-border)_50%,_var(--color-border)_75%,_transparent_75%,_transparent)] after:bg-[length:5px_5px] max-md:before:hidden max-md:after:hidden md:px-8 flex flex-col items-center gap-8 overflow-hidden">
      <div className="relative w-full max-w-full overflow-hidden">
        <div className="absolute top-0 left-0 w-full z-[110]">
          <Navbar />
        </div>
        <div className="pt-24 w-full">
          <StatusPageComponent />
        </div>
      </div>
    </div>
  );
}
