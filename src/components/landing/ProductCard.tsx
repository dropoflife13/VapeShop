import { cn } from "@/lib/utils";
import type { ShowcaseDevice } from "@/lib/theme";

interface ProductCardProps {
  device: ShowcaseDevice;
  rotationClass: string;
  positionClass: string;
  delayClass?: string;
  onSelect: () => void;
}

export function ProductCard({
  device,
  rotationClass,
  positionClass,
  delayClass,
  onSelect,
}: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Switch 3D viewer to ${device.title}`}
      className={cn(
        "group hidden xl:block absolute z-20 w-44 rounded-2xl border border-white/15 bg-[#071A52]/75 p-3 text-left text-white shadow-xl backdrop-blur-md transition-all duration-300",
        "hover:border-[#F58A1F]/70 hover:bg-[#0B246B]/90 hover:scale-105",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F58A1F]",
        "animate-float-slow",
        rotationClass,
        positionClass,
        delayClass
      )}
    >
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-[#F58A1F]">
        <span>{device.indexLabel}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#E86F12] transition-transform group-hover:scale-125" />
      </div>
      <p className="mt-1.5 font-display text-lg uppercase leading-none tracking-wide text-white">
        {device.title}
      </p>
      <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/65">
        {device.flavorOrSpec}
      </p>
      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">
        {device.puffs}
      </p>
    </button>
  );
}
