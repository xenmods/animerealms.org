"use client";

import { useState, useEffect, useRef } from "react";
import { providersConfig } from "@/lib/providers/list";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

const contentProviders = {
  anilist: { name: "Anilist", short: "anilist" },
  tmdb: { name: "TMDB", short: "tmdb" },
};

type ProviderStatus = {
  status: "pending" | "online" | "offline";
  ping: number | null;
};

export default function StatusPageComponent() {
  const t = useTranslations("Status");
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>({});
  const [isChecking, setIsChecking] = useState(false);
  const providerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allProviders = {
    ...contentProviders,
    ...providersConfig,
  };

  const checkStatuses = async () => {
    setIsChecking(true);
    const initialStatuses: Record<string, ProviderStatus> = {};
    Object.keys(allProviders).forEach((key) => {
      initialStatuses[key] = { status: "pending", ping: null };
    });
    setStatuses(initialStatuses);

    const providerKeys = Object.keys(allProviders);

    for (let i = 0; i < providerKeys.length; i++) {
      const key = providerKeys[i];
      try {
        const response = await fetch("/api/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: key }),
        });
        const data = await response.json();
        setStatuses((prev) => ({
          ...prev,
          [key]: {
            status: response.ok ? "online" : "offline",
            ping: data.ping,
          },
        }));
      } catch (error) {
        setStatuses((prev) => ({
          ...prev,
          [key]: {
            status: "offline",
            ping: null,
          },
        }));
      }
      // Scroll to the current provider
      providerRefs.current[key]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkStatuses();
  }, []);

  const getStatusColor = (status: "pending" | "online" | "offline") => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getPingColor = (ping: number | null) => {
    if (ping === null) return "text-gray-400";
    if (ping < 500) return "text-green-400";
    if (ping < 1000) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button onClick={checkStatuses} disabled={isChecking}>
          {isChecking ? (
            <>
              <Icon icon="svg-spinners:180-ring" className="mr-2" />
              {t("checking")}
            </>
          ) : (
            <>
              <Icon icon="solar:refresh-outline" className="mr-2" />
              {t("refresh")}
            </>
          )}
        </Button>
      </div>

      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            {t("contentProviders")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(contentProviders).map(([key, provider]) => (
              <motion.div
                key={key}
                ref={(el) => (providerRefs.current[key] = el)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-card p-4 rounded-lg shadow-md border border-border"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{provider.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-mono ${getPingColor(
                        statuses[key]?.ping
                      )}`}
                    >
                      {statuses[key]?.ping !== null
                        ? `${statuses[key]?.ping}ms`
                        : "N/A"}
                    </span>
                    <motion.div
                      animate={{
                        scale:
                          statuses[key]?.status === "pending" ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        repeat:
                          statuses[key]?.status === "pending"
                            ? Infinity
                            : 0,
                        duration: 1,
                      }}
                    >
                      <Icon
                        icon={
                          statuses[key]?.status === "online"
                            ? "solar:check-circle-bold"
                            : statuses[key]?.status === "offline"
                            ? "solar:close-circle-bold"
                            : "solar:clock-circle-bold"
                        }
                        className={`w-6 h-6 ${getStatusColor(
                          statuses[key]?.status
                        )}`}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
            {t("streamingProviders")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(providersConfig).map(([key, provider]) => (
              <motion.div
                key={key}
                ref={(el) => (providerRefs.current[key] = el)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * Object.keys(contentProviders).length }}
                className="bg-card p-4 rounded-lg shadow-md border border-border"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{provider.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-mono ${getPingColor(
                        statuses[key]?.ping
                      )}`}
                    >
                      {statuses[key]?.ping !== null
                        ? `${statuses[key]?.ping}ms`
                        : "N/A"}
                    </span>
                    <motion.div
                      animate={{
                        scale:
                          statuses[key]?.status === "pending" ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        repeat:
                          statuses[key]?.status === "pending"
                            ? Infinity
                            : 0,
                        duration: 1,
                      }}
                    >
                      <Icon
                        icon={
                          statuses[key]?.status === "online"
                            ? "solar:check-circle-bold"
                            : statuses[key]?.status === "offline"
                            ? "solar:close-circle-bold"
                            : "solar:clock-circle-bold"
                        }
                        className={`w-6 h-6 ${getStatusColor(
                          statuses[key]?.status
                        )}`}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
