"use client";
import React from "react";
import {
  motion,
  useTransform,
  useScroll,
  useVelocity,
  useSpring,
  useMotionValueEvent,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * This component renders a single particle.
 * It's separate so it can use the useTransform hook
 * to create a unique parallax effect for itself.
 */
function DriftingParticle({ particle, scrollY }) {
  const rawY = useTransform(
    scrollY,
    (latestScroll) => latestScroll * particle.parallaxDepth
  );

  // Apply spring physics for smooth, natural movement
  const y = useSpring(rawY, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const rotate = useTransform(
    scrollY,
    (latestScroll) => latestScroll * particle.rotationSpeed
  );

  const scale = useTransform(
    scrollY,
    [0, 500, 1000],
    [1, 1 + particle.scaleVariation, 1]
  );

  return (
    <motion.div
      className="absolute bg-muted-foreground rounded-full"
      style={{
        left: particle.left,
        top: particle.top,
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        boxShadow: "0 0 4px rgba(255, 255, 255, 0.8)",
        y: y,
        rotate: rotate,
        scale: scale,
      }}
      initial={{ opacity: 0 }}
      animate={{
        x: particle.xKeyframes,
        opacity: particle.opacityKeyframes,
      }}
      transition={{
        duration: particle.animationDuration,
        delay: particle.animationDelay,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "mirror",
      }}
    />
  );
}

type LightbarOptions = {
  imgSrc?: string;
  horizontalMotion?: boolean;
  sizeRange?: [number, number];
};

class Particle {
  x = 0;
  y = 0;
  radius = 0;
  direction = 0;
  speed = 0;
  lifetime = 0;
  ran = 0;
  image: null | HTMLImageElement = null;
  size = 10;
  options: LightbarOptions;

  constructor(
    canvas: HTMLCanvasElement,
    options: LightbarOptions = {
      horizontalMotion: false,
      sizeRange: [10, 15],
    }
  ) {
    if (options.imgSrc) {
      this.image = new Image();
      this.image.src = options.imgSrc;
    }
    this.options = options;
    this.reset(canvas);
    this.initialize(canvas);
  }

  reset(canvas: HTMLCanvasElement) {
    this.x = Math.round((Math.random() * canvas.width) / 2 + canvas.width / 4);
    this.y = Math.random() * 100 + 5;
    this.radius = 1 + Math.floor(Math.random() * 0.5);
    this.direction = (Math.random() * Math.PI) / 2 + Math.PI / 4;
    this.speed = 0.02 + Math.random() * 0.085;
    const second = 65;
    this.lifetime = second * 3 + Math.random() * (second * 30);
    this.size = this.options.sizeRange
      ? Math.random() *
          (this.options.sizeRange[1] - this.options.sizeRange[0]) +
        this.options.sizeRange[0]
      : 10;
    if (this.options.horizontalMotion) {
      this.direction = Math.random() <= 0.5 ? 0 : Math.PI;
      this.lifetime = 30 * second;
    }
    this.ran = 0;
  }

  initialize(canvas: HTMLCanvasElement) {
    this.ran = Math.random() * this.lifetime;
    const baseSpeed = this.speed;
    this.speed = Math.random() * this.lifetime * baseSpeed;
    this.update(canvas, 0);
    this.speed = baseSpeed;
  }

  update(canvas: HTMLCanvasElement, scrollVelocity: number = 0) {
    this.ran += 1;

    const addX = this.speed * Math.cos(this.direction);
    const addY = this.speed * Math.sin(this.direction);
    const scrollEffect = scrollVelocity * 0.005;

    this.x += addX;
    this.y += addY + scrollEffect;

    if (this.ran > this.lifetime) {
      this.reset(canvas);
    }
  }

  render(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.beginPath();
    const x = this.ran / this.lifetime;
    const o = (x - x * x) * 4;
    ctx.globalAlpha = Math.max(0, o * 0.8);
    if (this.image) {
      ctx.translate(this.x, this.y);
      const w = this.size;
      const h = (this.image.naturalWidth / this.image.naturalHeight) * w;
      if (this.image.src.includes("shark")) {
        const flip = this.direction === Math.PI ? 1 : -1;
        ctx.scale(flip, 1);
        ctx.drawImage(this.image, (-w / 2) * flip, -h / 2, w, h);
      } else {
        ctx.rotate(this.direction - Math.PI);
        ctx.drawImage(this.image, -w / 2, h, h, w);
      }
    } else {
      ctx.ellipse(
        this.x,
        this.y,
        this.radius,
        this.radius * 1.5,
        this.direction,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "white";
      ctx.fill();
    }
    ctx.restore();
  }
}

export function ParticlesCanvas() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const { scrollY } = useScroll();
  const scrollYVelocity = useVelocity(scrollY);
  const scrollVelocityRef = React.useRef(0);

  useMotionValueEvent(scrollYVelocity, "change", (latest) => {
    scrollVelocityRef.current = latest;
  });

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const particles: Particle[] = [];

    canvas.width = canvas.scrollWidth;
    canvas.height = canvas.scrollHeight;
    const particleCount = 265;
    let imageOverride: { image: string; sizeRange?: [number, number] }[] = [];
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();
    let imageParticleCount = particleCount;

    switch (true) {
      case (month === 11 && day >= 24 && day <= 26) || Math.random() < 0.051:
        imageOverride = [
          {
            image: "/lightbar-images/snowflake.svg",

            sizeRange: [12, 20] as [number, number],
          },

          {
            image: "/lightbar-images/santa.png",

            sizeRange: [25, 35] as [number, number],
          },
        ];

        imageParticleCount = particleCount * 0.1;

        break;

      case (month === 9 && day >= 29 && day <= 31) || Math.random() < 0.05:
        imageOverride = [
          {
            image: "/lightbar-images/ghost.png",

            sizeRange: [20, 33] as [number, number],
          },

          {
            image: "/lightbar-images/pumpkin.png",

            sizeRange: [25, 35] as [number, number],
          },
        ];

        imageParticleCount = particleCount * 0.0879;

        break;

      // case Math.random() < 0.1:

      //   imageOverride = [

      //     {

      //       image: "/lightbar-images/fishie.png",

      //       sizeRange: [10, 13] as [number, number],

      //     },

      //     {

      //       image: "/lightbar-images/shark.png",

      //       sizeRange: [48, 56] as [number, number],

      //     },

      //   ];

      //   imageParticleCount = particleCount * 0.075;

      //   break;

      case month + 1 === 4 && day === 20:
        imageOverride = [
          {
            image: "/lightbar-images/weed.png",

            sizeRange: [32, 40] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 6.25;

        break;

      case month + 1 === 6 && day === 9:
        imageOverride = [
          {
            image: "/lightbar-images/heart.svg",

            sizeRange: [32, 14] as [number, number],
          },

          {
            image: "/lightbar-images/wine.png",

            sizeRange: [15, 35] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 6.25;

        break;

      case Math.random() < 0.2:
        imageOverride = [
          {
            image: "/lightbar-images/cat.png",

            sizeRange: [30, 38] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 6.6;

        break;

      case Math.random() < 0.3:
        imageOverride = [
          {
            image: "/lightbar-images/camera.png",

            sizeRange: [24, 32] as [number, number],
          },

          {
            image: "/lightbar-images/popcorn.png",

            sizeRange: [18, 27] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 7.85;

        break;

      case Math.random() < 0.08:
        imageOverride = [
          {
            image: "/lightbar-images/cock.png",

            sizeRange: [25, 32] as [number, number],
          },

          {
            image: "/lightbar-images/egg.png",

            sizeRange: [18, 24] as [number, number],
          },

          {
            image: "/lightbar-images/barn.png",

            sizeRange: [32, 38] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 9;

        break;

      case Math.random() < 0.06:
        imageOverride = [
          {
            image: "/lightbar-images/money-sack.png",

            sizeRange: [24, 32] as [number, number],
          },

          {
            image: "/lightbar-images/money.png",

            sizeRange: [13, 23] as [number, number],
          },

          {
            image: "/lightbar-images/coin.png",

            sizeRange: [8, 20] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 8.45;

        break;

      case Math.random() < 0.075:
        imageOverride = [
          {
            image: "/lightbar-images/skull.png",

            sizeRange: [20, 28] as [number, number],
          },

          {
            image: "/lightbar-images/ship.png",

            sizeRange: [23, 27] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 10;

        break;

      case Math.random() < 0.03:
        imageOverride = [
          {
            image: "/lightbar-images/ts.png",

            sizeRange: [20, 32] as [number, number],
          },

          {
            image: "/lightbar-images/git.png",

            sizeRange: [20, 28] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 9;

        break;

      case Math.random() < 0.7:
        imageOverride = [
          {
            image: "/lightbar-images/beer.png",

            sizeRange: [15, 35] as [number, number],
          },

          {
            image: "/lightbar-images/beer-bottle.png",

            sizeRange: [10, 38] as [number, number],
          },

          {
            image: "/lightbar-images/wine.png",

            sizeRange: [15, 35] as [number, number],
          },

          {
            image: "/lightbar-images/cigarette.png",

            sizeRange: [10, 38] as [number, number],
          },

          {
            image: "/lightbar-images/cigarette2.png",

            sizeRange: [15, 35] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 11;

        break;

      case Math.random() < 0.05:
        imageOverride = [
          {
            image: "/lightbar-images/auto-gun.png",

            sizeRange: [28, 36] as [number, number],
          },

          {
            image: "/lightbar-images/gun.png",

            sizeRange: [23, 30] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 11.6;

        break;

      case Math.random() < 0.15:
        imageOverride = [
          {
            image: "/lightbar-images/star.png",

            sizeRange: [18, 28] as [number, number],
          },
        ];

        imageParticleCount = particleCount / 6.6;

        break;

      default:
        // Default case

        break;
    }
    // ... (end of your switch statement) ...

    for (let i = 0; i < particleCount; i += 1) {
      const isImageParticle = imageOverride && i <= imageParticleCount;
      const randomImageIndex = Math.floor(Math.random() * imageOverride.length);
      const sizeRange = imageOverride[randomImageIndex]?.sizeRange;
      const src = imageOverride[randomImageIndex]?.image;

      // Pass the options to your Particle class
      const particle = new Particle(canvas, {
        imgSrc: isImageParticle ? src : undefined,
        horizontalMotion: src?.includes("fishie") || src?.includes("shark"),
        sizeRange,
      });
      particles.push(particle);
    }

    let shouldTick = true;
    let handle: ReturnType<typeof requestAnimationFrame> | null = null;

    function particlesLoop() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (shouldTick) {
        for (const particle of particles) {
          particle.update(canvas, scrollVelocityRef.current);
        }
        shouldTick = false;
      }

      canvas.width = canvas.scrollWidth;
      canvas.height = canvas.scrollHeight;
      for (const particle of particles) {
        particle.render(canvas);
      }

      handle = requestAnimationFrame(particlesLoop);
    }

    const interval = setInterval(() => {
      shouldTick = true;
    }, 1e3 / 120); // tick 120 times a sec

    particlesLoop();

    return () => {
      if (handle) cancelAnimationFrame(handle);
      clearInterval(interval);
    };
  }, []); // Empty dependency array is correct

  // Return a <motion.canvas>
  return <motion.canvas className="particles w-full h-full" ref={canvasRef} />;
}

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { scrollY } = useScroll();
  const isDesktop = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 640;
  }, []);
  const particles = React.useMemo(() => {
    const particleCount = isDesktop ? 100 : 25;
    return Array.from({ length: particleCount }).map((_, i) => {
      const xKeyframes = [
        0,
        Math.random() * 30 - 15,
        Math.random() * 20 - 10,
        0,
      ];

      const baseOpacity = Math.random() * 0.3 + 0.2;
      const opacityKeyframes = [
        baseOpacity,
        baseOpacity + 0.3,
        baseOpacity,
        baseOpacity - 0.1,
        baseOpacity,
      ];

      const depthLayer = Math.floor(Math.random() * 3);
      let parallaxDepth;
      if (depthLayer === 0) {
        // Background layer - moves slowly
        parallaxDepth = Math.random() * 0.2 + 0.05;
      } else if (depthLayer === 1) {
        // Middle layer - moderate speed
        parallaxDepth = Math.random() * 0.4 + 0.3;
      } else {
        // Foreground layer - moves fast
        parallaxDepth = Math.random() * 0.6 + 0.6;
      }

      return {
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        animationDuration: Math.random() * 4 + 6,
        animationDelay: Math.random() * 5,
        xKeyframes,
        opacityKeyframes,
        parallaxDepth,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        scaleVariation: Math.random() * 0.3,
      };
    });
  }, [isDesktop]);
  return (
    <div
      className={cn(
        "relative flex min-h-[70vh] max-h-[75vh] flex-col items-center justify-center overflow-x-hidden bg-background w-full z-10",
        className
      )}
    >
      <div className="absolute inset-0 z-0 translate-y-[3rem] -translate-x-[2rem] opacity-75">
        <ParticlesCanvas />
      </div>
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-1">
        <motion.div
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[15rem] sm:w-[30rem] bg-gradient-conic from-accent via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute w-[100%] left-0 bg-background h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-40 h-[100%] left-0 bg-background  bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[15rem] sm:w-[30rem] bg-gradient-conic from-transparent via-transparent to-accent text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute w-40 h-[100%] right-0 bg-background  bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-[100%] right-0 bg-background h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-background blur-2xl"></div>
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>
        <div className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-black opacity-50 blur-3xl"></div>
        <motion.div className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-accent/80 blur-2xl"></motion.div>
        <motion.div className="absolute inset-auto z-50 hidden sm:block h-0.5 w-[15rem] sm:w-[30rem] -translate-y-[7rem] bg-accent/70"></motion.div>

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-background"></div>
      </div>

      <div className="relative z-50 flex -translate-y-40 flex-col items-center px-5">
        {children}
      </div>
    </div>
  );
};
