"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { Welcome } from "./_components/welcome";
import { Login } from "./_components/login";
import { Customize } from "./_components/customize";
import { Theme } from "./_components/theme";
import { Language } from "./_components/language";
import { Confetti } from "./_components/confetti";
import {
  OnboardingProvider,
  useOnboarding,
} from "./_components/onboarding-provider";
import Navbar from "@/components/shared/navbar";
import { Check } from "lucide-react";

const STEPS = [
  { id: "welcome", component: Welcome },
  { id: "language", component: Language },
  { id: "login", component: Login },
  { id: "theme", component: Theme },
  { id: "customize", component: Customize },
];

const variants = {
  initial: (direction: number) => ({
    x: `${direction * 100}%`,
    opacity: 0,
  }),
  animate: {
    x: "0%",
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: `${direction * -100}%`,
    opacity: 0,
  }),
};

function useOnboardingLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setOnboardingStep } = useOnboarding();

  const stepParam = searchParams.get("step");
  const redirectParam = searchParams.get("redirect");

  const currentIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.id === stepParam)
  );
  const previousIndex = useRef(currentIndex);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (currentIndex > previousIndex.current) setDirection(1);
    else if (currentIndex < previousIndex.current) setDirection(-1);
    previousIndex.current = currentIndex;

    const currentId = STEPS[currentIndex].id;
    setOnboardingStep(currentIndex);
    localStorage.setItem("onboardingStep", currentId);
  }, [currentIndex, setOnboardingStep]);

  useEffect(() => {
    if (!stepParam) {
      const savedStep = localStorage.getItem("onboardingStep") || "welcome";
      const url = `/onboarding?step=${savedStep}${
        redirectParam ? `&redirect=${redirectParam}` : ""
      }`;
      router.replace(url);
    }
  }, [stepParam, redirectParam, router]);

  const navigateTo = (index: number) => {
    const nextId = STEPS[index].id;
    const url = `/onboarding?step=${nextId}${
      redirectParam ? `&redirect=${redirectParam}` : ""
    }`;
    router.push(url);
  };

  const handlers = {
    onNext: () =>
      currentIndex < STEPS.length - 1 && navigateTo(currentIndex + 1),
    onPrev: () => currentIndex > 0 && navigateTo(currentIndex - 1),
    onSkip: () => {
      localStorage.setItem("onboardingComplete", "true");
      localStorage.removeItem("onboardingStep");
      router.push(redirectParam ? decodeURIComponent(redirectParam) : "/");
    },
  };

  return { currentIndex, direction, handlers, totalSteps: STEPS.length };
}

function OnboardingContent() {
  const { currentIndex, direction, handlers, totalSteps } =
    useOnboardingLogic();
  const CurrentStepComponent = STEPS[currentIndex].component;
  const isLastStep = currentIndex === totalSteps - 1;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isLastStep && !showConfetti) {
      // Optional: trigger confetti on mount for preview
      // setShowConfetti(true);
    }
  }, [isLastStep, showConfetti]);

  const handleSkipWithConfetti = () => {
    if (isLastStep) {
      setShowConfetti(true);
      setTimeout(() => {
        handlers.onSkip();
      }, 2000);
    } else {
      handlers.onSkip();
    }
  };

  const modifiedHandlers = {
    ...handlers,
    onSkip: handleSkipWithConfetti,
  };

  return (
    <>
      <div className="relative z-10 min-h-screen snap-start flex flex-col bg-background">
        <div className="absolute top-0 left-0 w-full z-20">
          <Navbar />
        </div>
        <div className="flex flex-1 w-full flex-col bg-background pt-20 overflow-hidden">
          <header className="z-10 flex w-full flex-none justify-center px-6 py-8 md:px-12">
            {/* Changed max-w constraints to allow full width if needed, or keep [90vw] if you want margins */}
            <div className="flex flex-col items-center gap-6 w-full">
              {/* Step Indicators Container */}
              {/* ADDED: flex-wrap, gap-y-4, and w-full */}
              <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-4 w-full">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center"
                    initial={false}
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        index === currentIndex
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : index < currentIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      {index < currentIndex ? <Check /> : index + 1}
                    </motion.div>
                    {index < totalSteps - 1 && (
                      <motion.div
                        className={`h-1 w-3 sm:w-8 mx-2 transition-all ${
                          index < currentIndex ? "bg-primary" : "bg-secondary"
                        }`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Step Counter */}
              <div className="text-sm font-medium text-muted-foreground">
                Step {currentIndex + 1} of {totalSteps}
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <div className="relative flex-1 w-full overflow-hidden">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="absolute inset-0 h-full w-full overflow-x-hidden no-scrollbar"
              >
                <div className="flex min-h-full w-full flex-col items-center justify-center px-6 md:px-12">
                  <div className="w-full max-w-5xl">
                    <CurrentStepComponent
                      onNext={handlers.onNext}
                      onPrev={handlers.onPrev}
                      onSkip={modifiedHandlers.onSkip}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <Suspense fallback={null}>
        <OnboardingContent />
      </Suspense>
    </OnboardingProvider>
  );
}
