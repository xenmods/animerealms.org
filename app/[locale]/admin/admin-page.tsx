"use client";

import { deleteDocument, updateDocument, deleteNotification } from "./action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import AdvancedJsonEditor from "@/components/admin/advanced-json-editor";
import { NotificationForm } from "@/components/admin/notification-form";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function AdminPage({
  searchParams,
  session,
  documents: initialDocuments,
  count: initialCount,
  searchResult: initialSearchResult,
  notifications: initialNotifications,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
  session: any;
  documents: string;
  count: number;
  searchResult: string | null;
  notifications: string;
}) {
  const t = useTranslations("Admin");
  const [content, setContent] = useState(
    initialSearchResult ? JSON.parse(initialSearchResult) : null
  );
  const router = useRouter();
  const [notifications, setNotifications] = useState(JSON.parse(initialNotifications));
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    setContent(initialSearchResult ? JSON.parse(initialSearchResult) : null);
  }, [initialSearchResult]);

  useEffect(() => {
    setNotifications(JSON.parse(initialNotifications));
  }, [initialNotifications]);

  const collectionName =
    typeof searchParams.collection === "string"
      ? searchParams.collection
      : "episodes";
  const page =
    typeof searchParams.page === "string" ? parseInt(searchParams.page) : 1;
  const id = typeof searchParams.id === "string" ? searchParams.id : "";

  const handleDelete = async () => {
    if (confirm(t("deleteDocumentConfirmation"))) {
      await deleteDocument(collectionName, id);
      router.push(`/admin?collection=${collectionName}`);
    }
  };

  const handleEditNotification = (notification: any) => {
    setSelectedNotification(notification);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (confirm(t("deleteNotificationConfirmation"))) {
      try {
        await deleteNotification(notificationId);
        setNotifications(notifications.filter((n: any) => n._id !== notificationId));
        toast.success(t("deleteNotificationSuccess"));
      } catch (error) {
        toast.error(t("deleteNotificationError"));
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("welcome", { name: session.user.name })}</h1>
      <p className="text-muted-foreground">
        {t("dbStatus")}
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t(selectedNotification ? "editNotification" : "createNotification")}</CardTitle>
          <CardDescription>
            {t(selectedNotification ? "editNotificationDescription" : "createNotificationDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationForm 
            notification={selectedNotification}
            onFinished={() => {
              setSelectedNotification(null);
              router.refresh();
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
          <CardDescription>
            {t("manageNotifications")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("content")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification: any) => (
                <TableRow key={notification._id}>
                  <TableCell>{notification.title}</TableCell>
                  <TableCell className="truncate max-w-sm">{notification.content}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditNotification(notification)}>{t("edit")}</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteNotification(notification._id)}>{t("delete")}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{collectionName}</CardTitle>
          <CardDescription>
            {t("paginationStatus", { start: (page - 1) * 10 + 1, end: Math.min(page * 10, initialCount), total: initialCount })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <form className="flex gap-2">
              <Input name="collection" value={collectionName} type="hidden" />
              <Input name="id" placeholder={t("searchById")} defaultValue={id} />
              <Button
                onClick={() =>
                  router.push(`/admin?collection=${collectionName}&id=${id}`)
                }
              >
                {t("search")}
              </Button>
            </form>
          </div>
          {content ? (
            <form
              action={async () => {
                await updateDocument(
                  collectionName,
                  id,
                  JSON.stringify(content)
                );
              }}
            >
              <div className="mt-4 space-y-2">
                <Label htmlFor="content">{t("documentContent")}</Label>
                <AdvancedJsonEditor
                  content={content}
                  onContentChange={setContent}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="submit" className="w-1/2">
                  {t("update")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="w-1/2"
                >
                  {t("deleteDocument")}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("id")}</TableHead>
                    <TableHead>{t("content")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {JSON.parse(initialDocuments).map((doc: any) => (
                    <TableRow key={doc._id}>
                      <TableCell>
                        <Link
                          href={`/admin?collection=${collectionName}&id=${
                            collectionName === "users" ? doc._id : doc.anilistId
                          }`}
                          className="text-primary hover:underline"
                        >
                          {collectionName === "users" ? doc._id : doc.anilistId}
                        </Link>
                      </TableCell>
                      <TableCell className="truncate max-w-sm">
                        {JSON.stringify(doc)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={`/admin?collection=${collectionName}&page=${
                        page > 1 ? page - 1 : 1
                      }`}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      href={`/admin?collection=${collectionName}&page=${page}`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href={`/admin?collection=${collectionName}&page=${
                        page + 1
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
