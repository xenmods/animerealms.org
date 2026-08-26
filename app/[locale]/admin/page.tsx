import { auth } from "@/auth";
import { getDocuments, searchCollection, getNotifications } from "./action";
import { notFound } from "next/navigation";
import { AdminPage } from "./admin-page";

export default async function AdminPageWrapper({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (session?.user?.name !== "xen") {
    notFound();
  }

  const collectionName =
    typeof (await searchParams.collection) === "string"
      ? searchParams.collection
      : "episodes";
  const page =
    typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
  const id = typeof searchParams.id === "string" ? searchParams.id : "";

  const { documents, count } = await getDocuments(collectionName, page);
  const searchResult = id ? await searchCollection(collectionName, id) : null;
  const notifications = await getNotifications();

  return (
    <AdminPage
      searchParams={await searchParams}
      session={session}
      documents={documents}
      count={count}
      searchResult={searchResult}
      notifications={notifications}
    />
  );
}
