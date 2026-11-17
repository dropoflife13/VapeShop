"use client";

import { useState } from "react";
import { SHOWCASE_DEVICES, type ShowcaseDeviceId } from "@/lib/theme";
import { ProductCard } from "@/components/landing/ProductCard";
import { cn } from "@/lib/utils";

interface Product3DViewerProps {
  activeId?: ShowcaseDeviceId;
  onSelectDevice?: (id: ShowcaseDeviceId) => void;
}

const CARD_SLOTS = [
  {
    rotationClass: "-rotate-6",
    positionClass: "-left-10 top-12",
    delayClass: "[animation-delay:0ms]",
  },
  {
    rotationClass: "rotate-6",
    positionClass: "-right-10 top-14",
    delayClass: "[animation-delay:1200ms]",
  },
  {
    rotationClass: "-rotate-3",
    positionClass: "-right-8 bottom-20",
    delayClass: "[animation-delay:2400ms]",
  },
] as const;

export function Product3DViewer({
  activeId: controlledId,
  onSelectDevice,
}: Product3DViewerProps) {
  const [internalId, setInternalId] = useState<ShowcaseDeviceId>("x-slimbar");
  const [loadedSrc, setLoadedSrc] = useState<string>("");

  const activeId = controlledId ?? internalId;
  const selectDevice = (id: ShowcaseDeviceId) => {
    if (onSelectDevice) onSelectDevice(id);
    else setInternalId(id);
  };

  const active =
    SHOWCASE_DEVICES.find((d) => d.id === activeId) ?? SHOWCASE_DEVICES[0]!;
  const otherDevices = SHOWCASE_DEVICES.filter((d) => d.id !== active.id);
  const isLoaded = loadedSrc === active.src;

  return (
    <div className="relative flex flex-col items-center">
      {/* Product switcher pill tabs */}
      <div
        className="relative z-30 mb-3 flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] p-1 backdrop-blur-md"
        role="tablist"
        aria-label="Select 3D vape device"
      >
        {SHOWCASE_DEVICES.map((device) => {
          const isSelected = device.id === active.id;
          return (
            <button
              key={device.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={`View ${device.label} 3D model`}
              onClick={() => selectDevice(device.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58A1F] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
                isSelected
                  ? "bg-gradient-to-r from-[#E86F12] to-[#F58A1F] text-white shadow-[0_0_20px_rgba(232,111,18,0.45)]"
                  : "text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
              )}
            >
              {device.label}
            </button>
          );
        })}
      </div>

      {/* Floating title header above the 3D stage */}
      <div className="relative z-20 flex w-full items-center justify-between gap-3 px-2 sm:px-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E86F12] dark:text-[#F58A1F]">
            {active.indexLabel} &middot; {active.flavorOrSpec}
          </p>
          <h2 className="mt-0.5 font-display text-2xl uppercase tracking-wide text-[var(--text-primary)] sm:text-3xl">
            {active.title}
          </h2>
        </div>

        <span className="hidden items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] backdrop-blur-md sm:inline-flex">
          {active.puffs}
        </span>
      </div>

      {/* Centered 3D viewer with warm amber glow and 3 floating tilted product cards */}
      <div className="relative flex w-full items-center justify-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#E86F12]/30 via-[#F58A1F]/15 to-transparent blur-[80px]"
        />

        {otherDevices.slice(0, 3).map((device, idx) => {
          const slot = CARD_SLOTS[idx] ?? CARD_SLOTS[0];
          return (
            <ProductCard
              key={device.id}
              device={device}
              rotationClass={slot.rotationClass}
              positionClass={slot.positionClass}
              delayClass={slot.delayClass}
              onSelect={() => selectDevice(device.id)}
            />
          );
        })}

        {!isLoaded && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-glass)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] backdrop-blur-md">
              <span className="h-2 w-2 animate-ping rounded-full bg-[#F58A1F]" />
              Loading {active.label}...
            </div>
          </div>
        )}

        <iframe
          key={active.src}
          src={active.src}
          title={`${active.title} 3D Viewer`}
          loading="eager"
          onLoad={() => setLoadedSrc(active.src)}
          className={cn(
            "relative z-10 block h-[390px] w-full border-0 bg-transparent transition-opacity duration-300 sm:h-[435px]",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
}
