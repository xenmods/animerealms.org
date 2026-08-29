"use client";

import { useState, useEffect, useMemo } from "react";
import * as Sortable from "@/components/ui/sortable";
import { GripVertical, Loader2, Play, CheckCircle2, XCircle, Trash2, Plus, FolderOpen, ExternalLink } from "lucide-react";
import { useSettings } from "@/components/settings-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { isTauri } from "@/lib/tauri";

import { providerNames, providersConfig } from "@/lib/providers/list";
import {
  getCustomProviders,
  saveCustomProvider,
  deleteCustomProvider,
  installProviderFromUrl,
  installProviderFromCode,
  benchmarkProvider,
  CustomProviderMeta,
  ProviderBenchmarkResult,
} from "@/lib/providers/custom-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function ProviderSettings() {
  const { settings, updateSetting } = useSettings();
  const [customProviders, setCustomProviders] = useState<CustomProviderMeta[]>([]);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [installTab, setInstallTab] = useState<"url" | "file" | "code">("url");
  const [installUrl, setInstallUrl] = useState("");
  const [installCode, setInstallCode] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);

  // Testing / Benchmark Modal State
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testProviderKey, setTestProviderKey] = useState<string | null>(null);
  const [testAnilistId, setTestAnilistId] = useState("21"); // One Piece default
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ProviderBenchmarkResult | null>(null);
  const [previewStreamUrl, setPreviewStreamUrl] = useState<string | null>(null);

  // Load custom providers
  const refreshCustomProviders = async () => {
    try {
      const list = await getCustomProviders();
      setCustomProviders(list);
    } catch (e) {
      console.error("Failed to load custom providers:", e);
    }
  };

  useEffect(() => {
    refreshCustomProviders();
  }, []);

  const allAvailableKeys = useMemo(() => {
    const customKeys = customProviders.map((c) => c.id);
    return Array.from(new Set([...providerNames, ...customKeys]));
  }, [customProviders]);

  const currentOrder = useMemo(() => {
    let order = settings.providerOrder || allAvailableKeys;
    // Append any missing keys
    for (const key of allAvailableKeys) {
      if (!order.includes(key)) {
        order = [...order, key];
      }
    }
    return order;
  }, [settings.providerOrder, allAvailableKeys]);

  const handleInstallFromUrl = async () => {
    if (!installUrl.trim()) {
      toast.error("Please enter a valid raw provider URL");
      return;
    }
    setIsInstalling(true);
    try {
      const installed = await installProviderFromUrl(installUrl.trim());
      toast.success(`Provider "${installed.name}" installed successfully!`);
      await refreshCustomProviders();
      updateSetting("providerOrder", [...currentOrder, installed.id]);
      setInstallUrl("");
      setIsInstallOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to install provider from URL");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsInstalling(true);
    try {
      const code = await file.text();
      const installed = await installProviderFromCode(code, file.name);
      toast.success(`Provider "${installed.name}" installed from file!`);
      await refreshCustomProviders();
      updateSetting("providerOrder", [...currentOrder, installed.id]);
      setIsInstallOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse provider script");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleInstallFromCode = async () => {
    if (!installCode.trim()) {
      toast.error("Please paste valid provider JavaScript code");
      return;
    }
    setIsInstalling(true);
    try {
      const installed = await installProviderFromCode(installCode.trim());
      toast.success(`Provider "${installed.name}" installed successfully!`);
      await refreshCustomProviders();
      updateSetting("providerOrder", [...currentOrder, installed.id]);
      setInstallCode("");
      setIsInstallOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to compile provider code");
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    try {
      await deleteCustomProvider(id);
      await refreshCustomProviders();
      updateSetting(
        "providerOrder",
        currentOrder.filter((k) => k !== id)
      );
      toast.success("Custom provider deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete provider");
    }
  };

  const handleOpenProvidersFolder = async () => {
    if (isTauri()) {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("open_providers_folder");
      } catch (err) {
        toast.error("Failed to open providers folder");
      }
    }
  };

  const openTesterForProvider = (providerKey: string) => {
    setTestProviderKey(providerKey);
    setTestResult(null);
    setPreviewStreamUrl(null);
    setIsTestOpen(true);
  };

  const runBenchmark = async () => {
    if (!testProviderKey) return;
    setIsTesting(true);
    setTestResult(null);
    setPreviewStreamUrl(null);

    const anilistNum = parseInt(testAnilistId, 10) || 21;
    try {
      const res = await benchmarkProvider(testProviderKey, anilistNum);
      setTestResult(res);
      if (res.success && res.streams && res.streams.length > 0) {
        setPreviewStreamUrl(res.streams[0].url);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        error: err.message || "Benchmark failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/40 p-4 rounded-xl border border-border/40">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Icon icon="solar:server-square-bold" className="w-5 h-5 text-primary" />
            <span>Scraper & Stream Providers</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Drag to reorder scrape priority. Top providers are queried first when opening an episode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTauri() && (
            <Button variant="outline" size="sm" onClick={handleOpenProvidersFolder}>
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Open Folder
            </Button>
          )}

          <Button variant="default" size="sm" onClick={() => setIsInstallOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Install Provider
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateSetting("providerOrder", allAvailableKeys)}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Sortable Provider List */}
      <Sortable.Root
        value={currentOrder}
        onValueChange={(newOrder) => updateSetting("providerOrder", newOrder)}
        orientation="vertical"
      >
        <Sortable.Content className="space-y-2 max-h-[480px] overflow-y-auto no-scrollbar py-1">
          {currentOrder.map((key) => {
            const isLocal = key === "local-download";
            const isCustom = key.startsWith("custom-");
            const conf = providersConfig[key] || {
              name: key,
              short: key,
            };

            return (
              <Sortable.Item
                key={key}
                value={key}
                className="bg-card hover:bg-card/80 transition-colors p-4 rounded-xl border border-border/40 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Sortable.ItemHandle>
                    <GripVertical className="text-muted-foreground/60 hover:text-foreground cursor-grab shrink-0" />
                  </Sortable.ItemHandle>

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{conf.name}</span>

                    {isLocal && (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-xs shrink-0">
                        Local / Offline
                      </Badge>
                    )}

                    {isCustom && (
                      <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10 text-xs shrink-0">
                        Custom Plugin
                      </Badge>
                    )}

                    {conf.name.includes("Dub") && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Dub
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => openTesterForProvider(key)}
                  >
                    <Play className="w-3.5 h-3.5 mr-1 text-primary" />
                    Test
                  </Button>

                  {isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteCustom(key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Sortable.Item>
            );
          })}
        </Sortable.Content>
        <Sortable.Overlay />
      </Sortable.Root>

      {/* Install Provider Dialog */}
      <Dialog open={isInstallOpen} onOpenChange={setIsInstallOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install Stream Provider</DialogTitle>
            <DialogDescription>
              Add a community or custom scraper plugin via URL, file upload, or JavaScript code.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 border-b border-border/40 pb-2">
            <button
              onClick={() => setInstallTab("url")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                installTab === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Raw URL
            </button>
            <button
              onClick={() => setInstallTab("file")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                installTab === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              File Upload (.js)
            </button>
            <button
              onClick={() => setInstallTab("code")}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                installTab === "code" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Paste Code
            </button>
          </div>

          <div className="py-2">
            {installTab === "url" && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Provider Script URL (GitHub / Gist Raw)</label>
                <Input
                  placeholder="https://raw.githubusercontent.com/.../provider.js"
                  value={installUrl}
                  onChange={(e) => setInstallUrl(e.target.value)}
                />
              </div>
            )}

            {installTab === "file" && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">Select JavaScript File</label>
                <Input type="file" accept=".js,.mjs,.ts" onChange={handleFileUpload} />
                <p className="text-xs text-muted-foreground">
                  You can also drop files directly into your <code>%APPDATA%/AnimeRealms/providers/</code> folder!
                </p>
              </div>
            )}

            {installTab === "code" && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">JavaScript Source Code</label>
                <textarea
                  className="w-full h-40 font-mono text-xs p-3 rounded-lg bg-card border border-border/40 focus:outline-hidden"
                  placeholder="export default { name: 'MyScraper', async scrape(id) { ... } }"
                  value={installCode}
                  onChange={(e) => setInstallCode(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsInstallOpen(false)}>
              Cancel
            </Button>
            {installTab === "url" && (
              <Button onClick={handleInstallFromUrl} disabled={isInstalling}>
                {isInstalling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Install from URL
              </Button>
            )}
            {installTab === "code" && (
              <Button onClick={handleInstallFromCode} disabled={isInstalling}>
                {isInstalling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Compile & Install
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive Test & Benchmark Modal */}
      <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="solar:chart-square-bold" className="w-5 h-5 text-primary" />
              <span>Scraper Benchmark Tester</span>
            </DialogTitle>
            <DialogDescription>
              Benchmark live scraping latency, verify stream extraction, and preview stream playback for{" "}
              <strong>{testProviderKey ? providersConfig[testProviderKey]?.name || testProviderKey : ""}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Test AniList ID (Default: 21 One Piece)</label>
                <Input
                  value={testAnilistId}
                  onChange={(e) => setTestAnilistId(e.target.value)}
                  placeholder="e.g. 21, 16498, 20"
                />
              </div>
              <Button onClick={runBenchmark} disabled={isTesting}>
                {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Run Test
              </Button>
            </div>

            {/* Test Results Card */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border ${
                  testResult.success ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"
                } space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    <span className="font-semibold text-sm">
                      {testResult.success ? "Scraper Passed" : "Scrape Failed"}
                    </span>
                  </div>

                  <Badge variant="secondary" className="font-mono text-xs">
                    ⏱️ {testResult.latencyMs} ms
                  </Badge>
                </div>

                {testResult.error && (
                  <p className="text-xs text-destructive font-mono bg-destructive/10 p-2.5 rounded-md">
                    {testResult.error}
                  </p>
                )}

                {testResult.streams && testResult.streams.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Found {testResult.streams.length} Stream(s):
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-xs">
                      {testResult.streams.map((s, idx) => (
                        <div key={idx} className="p-2 rounded-md bg-card border border-border/40 flex items-center justify-between gap-2">
                          <span className="font-semibold text-primary">{s.quality || "default"}</span>
                          <span className="text-muted-foreground truncate text-[11px] max-w-[280px]">{s.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
