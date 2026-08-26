"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { Notification } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";

type NotificationWithRead = Notification & { isRead: boolean };

const NOTIFICATION_STORAGE_KEY = "animerealms_read_notifications";

function ReadableDate(dateInput) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  const absoluteOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const absolute = date
    .toLocaleString("en-US", absoluteOptions)
    .replace(/ (AM|PM)/, "$1");

  let relative = "";

  const timeIntervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  if (diffInSeconds < 10) {
    relative = "Just Now";
  } else {
    for (const [unit, seconds] of Object.entries(timeIntervals)) {
      const interval = Math.floor(diffInSeconds / seconds);

      if (interval >= 1) {
        // Handle specific singular cases requested ("an hour ago")
        if (interval === 1) {
          relative = unit === "hour" ? "an hour ago" : `1 ${unit} ago`;
        } else {
          relative = `${interval} ${unit}s ago`;
        }
        break; // Stop at the largest unit
      }
    }
    // Fallback if less than a minute but more than "Just Now"
    if (!relative) relative = "moments ago";
  }

  return {
    absolute,
    relative,
  };
}

export function NotificationDialog() {
  const { data: session } = useSession();
  const t = useTranslations("NotificationDialog");
  const [notifications, setNotifications] = useState<NotificationWithRead[]>(
    []
  );
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationWithRead | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      let data: NotificationWithRead[] = await response.json();

      if (!session) {
        const readIds = JSON.parse(
          localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]"
        );
        data = data.map((n) => ({ ...n, isRead: readIds.includes(n._id) }));
      }

      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  }, [session]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (
    notification: NotificationWithRead
  ) => {
    setSelectedNotification(notification);

    if (!notification.isRead) {
      if (session) {
        try {
          await fetch(`/api/notifications/${notification._id}/read`, {
            method: "POST",
          });
        } catch (error) {
          console.error("Failed to mark as read on server", error);
        }
      } else {
        const readIds = JSON.parse(
          localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]"
        );
        if (!readIds.includes(notification._id)) {
          readIds.push(notification._id);
          localStorage.setItem(
            NOTIFICATION_STORAGE_KEY,
            JSON.stringify(readIds)
          );
        }
      }
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleBack = () => {
    setSelectedNotification(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedNotification(null);
    }
  };

  const handleMarkAsUnread = async () => {
    if (!selectedNotification) return;

    if (session) {
      try {
        await fetch(`/api/notifications/${selectedNotification._id}/unread`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to mark as unread on server", error);
      }
    } else {
      const readIds = JSON.parse(
        localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]"
      );
      const index = readIds.indexOf(selectedNotification._id);
      if (index > -1) {
        readIds.splice(index, 1);
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(readIds));
      }
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n._id === selectedNotification._id ? { ...n, isRead: false } : n
      )
    );
  };

  const handleMarkAllAsRead = async () => {
    if (session) {
      try {
        await fetch("/api/notifications/readAll", {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to mark all as read on server", error);
      }
    } else {
      const readIds = JSON.parse(
        localStorage.getItem(NOTIFICATION_STORAGE_KEY) || "[]"
      );
      readIds.splice(0, readIds.length, ...notifications.map((n) => n._id));
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(readIds));
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="relative px-2 py-1 rounded-full active:scale-95 transition-all ease-in-out duration-200 bg-muted"
        >
          <Icon icon="solar:bell-bold" className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] sm:min-h-[85vh] min-w-[95vw] sm:min-w-[50vw] bg-background border-border">
        {selectedNotification ? (
          <>
            <DialogHeader className="border-b border-border pb-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col justify-start items-start gap-4 w-full">
                  <DialogTitle className="text-xl lg:text-2xl font-bold text-foreground pr-6">
                    {selectedNotification.title}
                  </DialogTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between min-w-full gap-1">
                    <button
                      onClick={handleBack}
                      className="text-primary px-0 h-auto font-normal w-full flex items-center justify-start text-sm gap-2 hover:opacity-75 transition-all ease-in-out duration-200 cursor-pointer"
                    >
                      <Icon
                        icon="solar:arrow-left-linear"
                        className="h-4 w-4"
                      />
                      {t("backToNotifications")}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAsUnread}
                      className="text-primary bg-muted"
                    >
                      <Icon
                        icon="solar:notification-unread-bold"
                        className="h-4 w-4 mr-1"
                      />
                      {t("markAsUnread")}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Metadata section */}
            <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
              {selectedNotification.tags.map((tag) => (
                <>
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <span className="w-2 h-2 rounded-full bg-primary mr-1 inline-block"></span>
                    {tag}
                  </Badge>
                  •
                </>
              ))}
              <span className="text-muted-foreground">
                {
                  ReadableDate(new Date(selectedNotification.createdAt))
                    .absolute
                }
              </span>
              •
              <span className="text-muted-foreground">
                {
                  ReadableDate(new Date(selectedNotification.createdAt))
                    .relative
                }
              </span>
            </div>

            {/* Content section */}
            <ScrollArea className="h-[50vh] pr-4">
              <div className="prose prose-sm prose-headings:text-foreground prose-a:text-primary prose-a:no-underline prose-a:hover:opacity-50 prose-code:bg-muted prose-code:text-muted-foreground prose-code:rounded-lg prose-strong:font-semibold prose-strong:text-foreground prose-hr:opacity-50 prose-hr:my-4 prose-img:rounded-xl prose-img:mx-auto text-foreground sm:text-[16px] max-w-none pr-1 transition-all ease-in-out duration-200">
                <ReactMarkdown>{selectedNotification.content}</ReactMarkdown>
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <DialogHeader className="border-b border-border">
              <div className="flex items-center justify-between w-full">
                <DialogTitle className="text-xl lg:text-2xl font-bold text-foreground pr-6">
                  {t("title")}
                </DialogTitle>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t("unreadCount", { unreadCount })}
                  </span>
                  <button
                    className="text-primary text-sm hover:opacity-75 transition-all ease-in-out duration-200 cursor-pointer"
                    onClick={handleMarkAllAsRead}
                  >
                    {t("markAllAsRead")}
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchNotifications}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Icon icon="solar:refresh-linear" className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`cursor-pointer bg-card border-border hover:bg-card/80 transition-colors opacity-50 ${
                      !notification.isRead
                        ? "border-primary/50 opacity-100"
                        : ""
                    }`}
                  >
                    <CardHeader className="">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-card-foreground text-base sm:line-clamp-1">
                            <div className="flex sm:hidden flex-wrap gap-1">
                              {notification.tags.map((tag) => (
                                <div className="flex items-center gap-1 justify-start mr-0 pr-0 mb-2">
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                            {notification.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {/* Extract text from first paragraph of content */}
                            {notification.content
                              .split("\n")[0]
                              .substring(0, 100)}
                            ...
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex flex-row items-center gap-1 text-xs text-muted-foreground">
                      <div className="hidden sm:flex flex-wrap gap-1">
                        {notification.tags.map((tag) => (
                          <div className="flex items-center gap-1">
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                            •
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {
                          ReadableDate(new Date(notification.createdAt))
                            .absolute
                        }
                      </div>
                      •
                      <div className="text-xs text-muted-foreground">
                        {
                          ReadableDate(new Date(notification.createdAt))
                            .relative
                        }
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center text-muted-foreground py-10">
                    You have no notifications.
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
