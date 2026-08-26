"use client";

import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { THEMES } from "@/lib/consts";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/shadcn-io/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function ThemePreview({
  theme,
  currentTheme,
  setTheme,
}: {
  theme: string;
  currentTheme?: string;
  setTheme: (theme: string) => void;
}) {
  const isActive = currentTheme === theme;

  return (
    <div
      role="button"
      onClick={() => setTheme(theme)}
      className={`scroll-mt-32 w-full h-32 relative rounded-[8px] border bg-gradient-to-br from-primary/20 to-secondary/10 bg-clip-content transition-colors duration-150 border-primary/30 cursor-pointer ${theme} overflow-hidden`}
    >
      <div className="absolute top-2 left-2">
        <div className="h-5 w-5 bg-primary rounded-full"></div>
        <div className="h-5 w-5 bg-secondary rounded-full -mt-2"></div>
      </div>

      {isActive && (
        <span className="absolute top-3 right-3 text-xs text-foreground transition-opacity duration-150 opacity-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            width="1em"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 22l-10-10.598 2.798-2.859 7.149 7.473 13.144-14.016 2.909 2.806z"></path>
          </svg>
        </span>
      )}

      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/5 h-4/5 rounded-t-lg -mb-px bg-background overflow-hidden">
        <div className="relative w-full h-full">
          <div className="bg-primary/50 w-[130%] h-10 absolute left-1/2 -top-5 blur-xl transform -translate-x-1/2 rounded-[100%]"></div>

          {/* Top navigation dots */}
          <div className="p-2 flex justify-between items-center">
            <div className="flex space-x-1">
              <div className="bg-muted w-4 h-2 rounded-full"></div>
              <div className="bg-muted w-2 h-2 rounded-full"></div>
              <div className="bg-muted w-2 h-2 rounded-full"></div>
            </div>
            <div className="bg-muted w-2 h-2 rounded-full"></div>
          </div>

          {/* Content lines */}
          <div className="mt-1 flex items-center flex-col gap-1">
            <div className="bg-muted w-8 h-0.5 rounded-full"></div>
            <div className="bg-muted w-6 h-0.5 rounded-full"></div>
            <div className="bg-muted w-16 h-2 mt-1 rounded-full"></div>
          </div>

          {/* Bottom items */}
          <div className="mt-5 px-3">
            <div className="flex gap-1 items-center">
              <div className="bg-muted w-2 h-2 rounded-full"></div>
              <div className="bg-muted w-8 h-0.5 rounded-full"></div>
            </div>
            <div className="flex w-full gap-1 mt-1">
              <div className="bg-muted h-2 w-3 rounded-full"></div>
              <div className="bg-muted h-2 w-3 rounded-full"></div>
              <div className="bg-muted h-2 w-3 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 left-3 text-foreground text-xs font-medium capitalize">
        {THEMES[theme]}
      </div>
    </div>
  );
}

export function SettingInput({
  title,
  description,
  value,
  type,
  onChange,
  placeholder,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-start justify-between gap-4 py-4 w-full"
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="rounded-md w-full bg-card hover:bg-accent transition-all ease-in-out duration-200 flex items-center px-4 py-3 gap-2">
        <Input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent"
          type={type}
        />
      </div>
    </motion.div>
  );
}

export function SettingItem({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-start justify-between gap-4 py-4 w-full"
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="rounded-md w-full bg-card hover:bg-accent transition-all ease-in-out duration-200 flex items-center px-4 py-3 gap-2">
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
    </motion.div>
  );
}

export function SettingSliderItem({
  title,
  description,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "%",
}: {
  title: string;
  description: string;
  value: number;
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-start justify-between gap-4 py-4 w-full"
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="rounded-md w-full bg-card hover:bg-accent transition-all ease-in-out duration-200 flex items-center px-4 py-3 gap-4">
        <Slider
          value={[value]}
          onValueChange={onValueChange}
          min={min}
          max={max}
          step={step}
          className="flex-grow"
        />
        <span className="font-mono text-sm text-foreground w-16 text-center bg-background/50 rounded-md py-1">
          {value}
          {unit}
        </span>
      </div>
    </motion.div>
  );
}

export function SettingSelectItem({
  title,
  description,
  value,
  onValueChange,
  options,
}: {
  title: string;
  description: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-start justify-between gap-4 py-4 w-full"
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="rounded-md w-full bg-card hover:bg-accent transition-all ease-in-out duration-200 flex items-center px-4 py-3 gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}

export function SettingColorPicker({
  title,
  description,
  value,
  onChange,
  colors,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (color: string) => void;
  colors: string[];
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-start justify-between gap-4 py-4 w-full"
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="rounded-md w-full bg-card hover:bg-accent transition-all ease-in-out duration-200 flex items-center px-4 py-3 gap-2">
        {colors.map((color) => (
          <Button
            key={color}
            variant="outline"
            className={`w-8 h-8 rounded-full p-0 border-2 ${
              value === color ? "border-primary" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          >
            {value === color && (
              <Icon icon="solar:check-read-bold" className="text-white" />
            )}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-8 h-8 rounded-full p-0 border-2 border-dashed border-muted-foreground hover:border-primary ml-2 bg-transparent"
              title="Pick any color"
            >
              <Icon
                icon="solar:palette-bold"
                className="text-muted-foreground"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" side="right">
            <ColorPicker
              defaultValue={value}
              value={value} // Assuming this is your state variable
              className="max-w-sm rounded-md border bg-background p-4 shadow-sm"
              onChange={(customColor) => {
                const newColorString = customColor.toString();
                console.log(customColor);
                // GUARD CLAUSE: Only update if the value is actually different
                if (newColorString !== value) {
                  console.log("Updating color to:", newColorString);
                  onChange(newColorString);
                }
              }}
            >
              <ColorPickerSelection className="h-40" />
              <div className="flex items-center gap-4">
                <ColorPickerEyeDropper />
                <div className="grid w-full gap-1">
                  <ColorPickerHue />
                  <ColorPickerAlpha />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ColorPickerOutput />
                <ColorPickerFormat />
              </div>
            </ColorPicker>
          </PopoverContent>
        </Popover>
      </div>
    </motion.div>
  );
}

export function SettingToggleGroup({
  title,
  description,
  value,
  onValueChange,
  options,
}: {
  title: string;
  description: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex flex-col items-start justify-between gap-4 py-4 w-full"
    >
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      <div className="rounded-md w-full bg-card hover:bg-accent transition-all ease-in-out duration-200 flex items-center px-4 py-3 gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
