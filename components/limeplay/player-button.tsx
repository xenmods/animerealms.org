import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

const PlayerButton: React.FC<ButtonProps> = ({
  children,
  title,
  className,
  ...props
}) => {
  const baseStyle =
    "active:scale-95 hover:scale-110 transition-transform duration-200 p-1 hover:bg-white/10 rounded-full drop-shadow-2xl";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className={`${baseStyle} ${className}`} {...props}>
          {children}
        </button>
      </TooltipTrigger>
      {title && (
        <TooltipContent className="bg-background/90 backdrop-blur-md rounded-2xl border border-white/10 px-2 py-1 text-muted-foreground">
          {title}
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export default PlayerButton;
