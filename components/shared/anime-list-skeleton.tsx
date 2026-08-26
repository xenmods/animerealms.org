import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface AnimeListSkeletonProps {
  className?: string;
}

export function AnimeListSkeleton({ className }: AnimeListSkeletonProps) {
  // Create an array of 6 items to fill the view
  const skeletonItems = Array.from({ length: 10 });

  return (
    <div
      className={cn(
        "flex w-full min-w-[90vw] max-w-[90vw] flex-col gap-6 py-8",
        className
      )}
    >
      {/* Title Skeleton */}
      <h2 className="flex w-full flex-row items-center justify-between gap-2 text-sm tracking-wider">
        <div className="flex flex-row items-center gap-2">
          {/* Icon placeholder */}
          <Skeleton className="h-6 w-6 rounded-full" />
          {/* Title placeholder */}
          <Skeleton className="h-6 w-32 rounded-md" />
        </div>
      </h2>

      {/* Carousel Skeleton */}
      <Carousel
        opts={{
          align: "start",
          loop: false,
          slidesToScroll: 1,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {skeletonItems.map((_, index) => (
            <CarouselItem
              key={index}
              className="basis-[45%] sm:basis-[30%] md:basis-[23%] lg:basis-[18%] xl:basis-[15%] rounded-xl pl-2"
            >
              <div className="flex flex-col gap-2 rounded-xl p-2">
                {/* Image Skeleton */}
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />

                {/* Text Skeletons */}
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
