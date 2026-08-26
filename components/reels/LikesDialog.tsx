"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getReelLikes, LikingUser } from "@/actions/reels";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LikesDialogProps {
  animeId: string;
  trigger: React.ReactNode;
}

export function LikesDialog({ animeId, trigger }: LikesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<LikingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getReelLikes(animeId).then((data) => {
        setUsers(data);
        setLoading(false);
      });
    }
  }, [isOpen, animeId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Likes</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full pr-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              No likes yet. Be the first!
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">
                    {user.name || "Anonymous"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
