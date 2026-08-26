import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getReviews, deleteAllReviews } from "@/lib/actions/review-actions";
import { Button } from "@/components/ui/button";
import { StarIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Client component for the delete button to handle interactivity
import DeleteAllButton from "./_components/delete-all-button";

export default async function ReviewsPage() {
  const session = await auth();

  if (session?.user?.name !== "xen") {
    notFound();
  }

  const reviews = await getReviews();

  return (
    <div className="container mx-auto py-10 space-y-6 p-4 sm:p-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Reviews</h1>
          <p className="text-muted-foreground">
            See what users are saying about the realm!
          </p>
        </div>
        <DeleteAllButton />
      </div>

      <div className="border rounded-md bg-background/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="w-[50%]">Message</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No reviews yet... (｡•́︿•̀｡)
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {review.userImage ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border">
                          {/* Trying to handle complex image object or string */}
                          <Image
                            src={
                              typeof review.userImage === "string"
                                ? review.userImage
                                : review.userImage.large ||
                                  review.userImage.medium ||
                                  "/cat.jpg"
                            }
                            alt={review.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : null}
                      <span>{review.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className="w-4 h-4 text-yellow-500 fill-yellow-500"
                        />
                      ))}
                      <span className="ml-2 text-muted-foreground text-xs">
                        ({review.rating}/5)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="break-words whitespace-pre-wrap">
                    {review.message || (
                      <span className="text-muted-foreground italic">
                        No message provided
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
