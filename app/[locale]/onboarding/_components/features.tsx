"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const features = [
  {
    title: "AniList Sync",
    description:
      "Sync your watch history with AniList to keep your progress updated.",
    icon: "simple-icons:anilist",
  },
  {
    title: "Player Customization",
    description:
      "Customize your player with features like skip intro, double-tap to seek, and more.",
    icon: "solar:videocamera-bold",
  },
  {
    title: "Themes",
    description:
      "Choose from a variety of themes to personalize your experience.",
    icon: "solar:palette-bold",
  },
  {
    title: "Provider Ordering",
    description: "Prioritize your favorite sources for streaming anime.",
    icon: "solar:box-bold",
  },
];

export function Features({ onNext, onPrev }: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold">Discover a World of Anime</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Here are some of the features that await you.
        </p>
      </motion.div>
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full max-w-sm"
      >
        <CarouselContent>
          {features.map((feature, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex flex-col aspect-video items-center justify-center p-6">
                    <Icon icon={feature.icon} className="h-12 w-12 mb-4" />
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-center mt-2">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 flex space-x-4"
      >
        <Button variant="outline" onClick={onPrev}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </motion.div>
    </div>
  );
}
