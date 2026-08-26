"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/settings-context";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  SettingColorPicker,
  SettingItem,
  SettingSelectItem,
  SettingSliderItem,
  SettingToggleGroup,
} from "./setting-helpers";

const textStyleOptions = [
  { value: "default", label: "Default" },
  { value: "raised", label: "Raised" },
  { value: "border", label: "Border" },
  { value: "depressed", label: "Depressed" },
  { value: "drop-shadow", label: "Drop Shadow" },
];

const colors = ["#FFFFFF", "#0000FF", "#FFFF00", "#00FF00"];

export function SubtitleSettings() {
  const t = useTranslations("Settings");
  const { settings, updateSetting, reset } = useSettings();
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const handleSubtitleSettingChange = (key, value) => {
    updateSetting("subtitleSettings", {
      ...settings.subtitleSettings,
      [key]: value,
    });
  };

  const resetSubtitleSettings = () => {
    updateSetting("subtitleSettings", {
      backgroundOpacity: 0,
      backgroundBlur: false,
      textSize: 130,
      textStyle: "border",
      boldText: true,
      color: "#FFFFFF",
      verticalPosition: "default",
    });
  };

  // Inject Font for Preview
  useEffect(() => {
    const { fontFamily } = settings.subtitleSettings;
    if (fontFamily) {
      const fontId = `subtitle-font-preview-${fontFamily.replace(/\s+/g, "-")}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
          /\s+/g,
          "+"
        )}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [settings.subtitleSettings.fontFamily]);

  const generateOutline = (width: number, color: string) => {
    const steps = 8;
    let shadow = "";
    for (let i = 0; i < steps; i++) {
      const angle = (i * 2 * Math.PI) / steps;
      const x = Math.round(width * Math.cos(angle) * 10) / 10;
      const y = Math.round(width * Math.sin(angle) * 10) / 10;
      shadow += `${x}px ${y}px 0 ${color}${i < steps - 1 ? ", " : ""}`;
    }
    return shadow;
  };

  const getTextStyle = () => {
    const { textStyle, boldText, color, outlineWidth } =
      settings.subtitleSettings;
    const style: React.CSSProperties = {};
    if (boldText) {
      style.fontWeight = "bold";
    }
    style.color = color;

    // Apply font family
    if (settings.subtitleSettings.fontFamily) {
      style.fontFamily = `"${settings.subtitleSettings.fontFamily}", sans-serif`;
    }

    switch (textStyle) {
      case "raised":
        style.textShadow = "1px 1px 1px black, 0 0 1px black";
        break;
      case "border":
        style.textShadow = generateOutline(
          outlineWidth !== undefined ? outlineWidth : 2,
          "#000000"
        );
        break;
      case "depressed":
        style.textShadow = "-1px -1px 1px white, 0 0 1px white";
        break;
      case "drop-shadow":
        style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
        break;
      default:
        break;
    }
    return style;
  };

  const PreviewContent = ({ isFullscreen = false }) => (
    <div className={isFullscreen ? "w-full h-screen" : "w-full aspect-video"}>
      <div className="relative w-full h-full bg-card rounded-lg overflow-hidden">
        <img
          src="/anime-screencap.png"
          alt="Preview background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 flex items-end justify-center px-4"
          style={{
            paddingBottom:
              settings.subtitleSettings.verticalPosition === "high"
                ? "15%"
                : "10%",
            transform: isFullscreen ? "scale(1)" : "scale(0.5)",
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="rounded-lg px-4 py-3 text-center backdrop-blur-sm"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${settings.subtitleSettings.backgroundOpacity})`,
              backdropFilter: settings.subtitleSettings.backgroundBlur
                ? `blur(4px)`
                : "none",
            }}
          >
            <div
              style={{
                fontSize: `${settings.subtitleSettings.textSize}%`,
                ...getTextStyle(),
              }}
            >
              <p>A streaming site with so many features?</p>
              <p>...this can't be!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          <SettingSliderItem
            title={t("background_opacity")}
            description={t("background_opacity_description")}
            value={settings.subtitleSettings.backgroundOpacity * 100}
            onValueChange={(value) =>
              handleSubtitleSettingChange("backgroundOpacity", value[0] / 100)
            }
            min={0}
            max={100}
            step={1}
            unit="%"
          />

          <SettingItem
            title={t("background_blur")}
            description={t("background_blur_description")}
            checked={settings.subtitleSettings.backgroundBlur}
            onCheckedChange={(checked) =>
              handleSubtitleSettingChange("backgroundBlur", checked)
            }
          />

          <SettingSliderItem
            title={t("text_size")}
            description={t("text_size_description")}
            value={settings.subtitleSettings.textSize}
            onValueChange={(value) =>
              handleSubtitleSettingChange("textSize", value[0])
            }
            min={50}
            max={200}
            step={1}
            unit="%"
          />

          <SettingSelectItem
            title="Font Family"
            description="Select the font family for subtitles."
            value={settings.subtitleSettings.fontFamily || "Rubik"}
            onValueChange={(value) =>
              handleSubtitleSettingChange("fontFamily", value)
            }
            options={[
              { value: "Rubik", label: "Rubik" },
              { value: "Roboto", label: "Roboto" },
              { value: "Open Sans", label: "Open Sans" },
              { value: "Poppins", label: "Poppins" },
              { value: "Montserrat", label: "Montserrat" },
              { value: "Nunito", label: "Nunito" },
              { value: "Comic Neue", label: "Comic Neue" },
            ]}
          />

          <SettingSliderItem
            title="Outline Width"
            description="Adjust the thickness of the text outline."
            value={
              settings.subtitleSettings.outlineWidth !== undefined
                ? settings.subtitleSettings.outlineWidth
                : 2
            }
            onValueChange={(value) =>
              handleSubtitleSettingChange("outlineWidth", value[0])
            }
            min={0}
            max={5}
            step={0.5}
            unit="px"
          />

          <SettingSelectItem
            title={t("text_style")}
            description={t("text_style_description")}
            value={settings.subtitleSettings.textStyle}
            onValueChange={(value) =>
              handleSubtitleSettingChange("textStyle", value)
            }
            options={textStyleOptions}
          />
          <div className="lg:hidden">
            <SettingItem
              title={t("bold_text")}
              description={t("bold_text_description")}
              checked={settings.subtitleSettings.boldText}
              onCheckedChange={(checked) =>
                handleSubtitleSettingChange("boldText", checked)
              }
            />
          </div>
          <div className="lg:hidden">
            <SettingColorPicker
              title={t("color")}
              description={t("color_description")}
              value={settings.subtitleSettings.color}
              onChange={(color) => handleSubtitleSettingChange("color", color)}
              colors={colors}
            />
          </div>

          <SettingToggleGroup
            title={t("vertical_position")}
            description={t("vertical_position_description")}
            value={settings.subtitleSettings.verticalPosition}
            onValueChange={(value) =>
              handleSubtitleSettingChange("verticalPosition", value)
            }
            options={[
              { value: "default", label: "Default" },
              { value: "high", label: "High" },
            ]}
          />
        </div>

        {/* Preview Panel */}
        <div>
          <div className="relative mb-4">
            <button
              onClick={() => setIsFullscreenOpen(true)}
              className="absolute top-4 right-4 z-10 bg-accent/30 text-white rounded p-2 transition-colors"
              aria-label="View fullscreen"
            >
              <Icon icon="solar:maximize-outline" width={20} height={20} />
            </button>
            <PreviewContent />
          </div>
          <div className="lg:block hidden">
            <SettingItem
              title={t("bold_text")}
              description={t("bold_text_description")}
              checked={settings.subtitleSettings.boldText}
              onCheckedChange={(checked) =>
                handleSubtitleSettingChange("boldText", checked)
              }
            />
          </div>

          <div className="lg:block hidden">
            <SettingColorPicker
              title={t("color")}
              description={t("color_description")}
              value={settings.subtitleSettings.color}
              onChange={(color) => handleSubtitleSettingChange("color", color)}
              colors={colors}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="min-w-screen h-auto aspect-video sm:min-h-screen max-w-none p-0 border-0">
          <PreviewContent isFullscreen={true} />
        </DialogContent>
      </Dialog>

      <div className="flex justify-start">
        <Button variant="outline" onClick={resetSubtitleSettings}>
          {t("reset_subtitle_settings")}
        </Button>
      </div>
    </div>
  );
}
