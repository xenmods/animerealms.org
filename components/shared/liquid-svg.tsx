"use client";

/**
 * Global SVG Filters for View Transitions
 * This component is mounted in the root layout to provide filters referenced by CSS.
 */
export function LiquidSVG() {
  return (
    <svg
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="liquid-wave" colorInterpolationFilters="sRGB">
          {/* 
            Generate noise for the distortion. 
            baseFrequency: 0.005 = Large, distinct liquid waves
            numOctaves: 1 = Clean, smooth flow (less grit)
          */}
          <feTurbulence
            type="turbulence"
            baseFrequency="0.005"
            numOctaves="1"
            seed="5"
            result="turbulence"
          >
            {/* Animate the frequency to make the liquid "flow" and morph over time */}
            <animate
              attributeName="baseFrequency"
              values="0.005;0.008;0.005"
              dur="20s"
              repeatCount="indefinite"
            />
          </feTurbulence>

          {/* 
            Displace the source image.
            scale: 100 = Very deep distortion for a strong "refraction" feel
          */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="100"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            {/* Animate the scale slightly to make the refraction "breathe" */}
            <animate
              attributeName="scale"
              values="90;110;90"
              dur="10s"
              repeatCount="indefinite"
            />
          </feDisplacementMap>

          {/* Moderate blur to smooth out the extreme displacement edges */}
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
    </svg>
  );
}
