"use client";

import { useState } from "react";
import { PRODUCT_THEMES, type ProductWorldId } from "@/lib/product-themes";
import { SessionStatusBanner } from "@/components/SessionStatusBanner";
import { ProductWorld } from "@/components/world/ProductWorld";
import { WorldSections } from "@/components/world/WorldSections";

export default function HomePage() {
  const [activeId, setActiveId] = useState<ProductWorldId>("xv2-plus");
  const activeTheme =
    PRODUCT_THEMES.find((t) => t.id === activeId) ?? PRODUCT_THEMES[0]!;

  return (
    <div className="min-h-screen">
      <SessionStatusBanner />
      <main>
        <ProductWorld activeId={activeId} onSelect={setActiveId} />
        <WorldSections
          activeTheme={activeTheme}
          onSelectProduct={setActiveId}
        />
      </main>
    </div>
  );
}
