"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MDEditor from "@uiw/react-md-editor";
import { useTranslations } from "next-intl";
import { createNotification, updateNotification } from "@/app/[locale]/admin/action";
import { toast } from "sonner";

export function NotificationForm({ notification, onFinished }: { notification?: any, onFinished: () => void }) {
  const t = useTranslations("Admin");
  const tShared = useTranslations("Shared");
  const [id, setId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (notification) {
      setId(notification._id);
      setTitle(notification.title);
      setContent(notification.content);
      setTags(notification.tags.join(", "));
    } else {
      clearForm();
    }
  }, [notification]);

  const clearForm = () => {
    setId(undefined);
    setTitle("");
    setContent("");
    setTags("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      
      if (id) {
        await updateNotification({ id, title, content, tags: tagsArray });
        toast.success(t("updateSuccess"));
      } else {
        await createNotification({ title, content, tags: tagsArray });
        toast.success(t("createSuccess"));
      }
      clearForm();
      onFinished();
    } catch (error) {
      toast.error(id ? t("updateError") : t("createError"));
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="content">{t("content")}</Label>
        <MDEditor
          value={content}
          onChange={(value) => setContent(value || "")}
        />
      </div>
      <div>
        <Label htmlFor="tags">{t("tags")}</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{id ? t("update") : t("create")} {t("notification")}</Button>
        {id && <Button type="button" variant="outline" onClick={() => { clearForm(); onFinished(); }}>{tShared("cancel")}</Button>}
      </div>
    </form>
  );
}
