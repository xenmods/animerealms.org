import { auth } from "@/auth";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.name !== "xen") {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20}>
          <div className="flex flex-col space-y-4 p-4">
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            <Link
              href={{
                pathname: "/admin",
                query: { collection: "episodes" },
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Episodes
            </Link>
            <Link
              href={{
                pathname: "/admin",
                query: { collection: "mappings" },
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Mappings
            </Link>
            <Link
              href={{
                pathname: "/admin",
                query: { collection: "providers_episodes" },
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Provider Episodes
            </Link>
            <Link
              href={{
                pathname: "/admin",
                query: { collection: "providers_mappings" },
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Provider Mappings
            </Link>
            <Link
              href={{
                pathname: "/admin",
                query: { collection: "users" },
              }}
              className="text-muted-foreground hover:text-primary"
            >
              Users
            </Link>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={80}>
          <div className="p-4">{children}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
