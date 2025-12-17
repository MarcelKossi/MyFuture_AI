"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

type ChartConfig = {
  [key: string]: {
    label?: string;
    icon?: React.ComponentType;
    color?: string;
    theme?: {
      light?: string;
      dark?: string;
    };
  };
};

const ChartContext = React.createContext<{ config: ChartConfig }>({ config: {} });
export function useChart() {
  return React.useContext(ChartContext);
}

const THEMES = ["light", "dark"] as const;
type ThemeKey = (typeof THEMES)[number];

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function detectTheme(): ThemeKey {
  if (!isBrowser()) return "light";
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.body?.classList.contains("dark")) return "dark";
  return "light";
}

function trySanitize(input: unknown): string {
  const raw = input === null || input === undefined ? "" : String(input);
  if (!isBrowser()) return raw;
  try {
    // prefer DOMPurify if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const DOMPurify = require("dompurify");
    return DOMPurify.sanitize(raw);
  } catch {
    // fallback simple escape (safe for plain text)
    return raw.replace(/[&<>"']/g, (c) => {
      switch (c) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return c;
      }
    });
  }
}

const baseContainerClass =
  "chart-container flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none";

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const chartId = id ?? React.useId();
  const themeKey = useThemeKey();

  const colorEntries = React.useMemo(
    () => Object.entries(config).filter(([, item]) => item.theme || item.color),
    [config]
  );

  const styleVars = React.useMemo<React.CSSProperties>(() => {
    const vars: React.CSSProperties = {};
    for (const [key, item] of colorEntries) {
      const color = (item as any).theme?.[themeKey] ?? (item as any).color;
      if (color) {
        // CSS custom props must be string values
        (vars as any)[`--color-${key}`] = color;
      }
    }
    return vars;
  }, [colorEntries, themeKey]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div data-chart={chartId} ref={ref} style={styleVars} className={cn(baseContainerClass, className)} {...props}>
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = (_props: { id: string; config: ChartConfig }) => null;

type TooltipItem = {
  name?: string;
  value?: string | number | null;
  color?: string;
  dataKey?: string;
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean;
    payload?: any[];
    label?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
  }
>(
  ({ active, payload, label, className, indicator = "dot", hideLabel = false, hideIndicator = false, ...props }, ref) => {
    const { config } = useChart();
    if (!active || !payload?.length) return null;

    const indicatorClassName = cn("shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]", {
      "h-2 w-2 rounded-full": indicator === "dot",
      "h-0.5 w-2": indicator === "line",
      "h-0.5 w-2 border-t-2 border-dashed bg-transparent": indicator === "dashed",
    });

    return (
      <div
        ref={ref}
        role="tooltip"
        aria-label={label ?? "Chart tooltip"}
        className={cn("grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl", className)}
        {...props}
      >
        {!hideLabel && <div className="font-medium">{config[label ?? ""]?.label ?? label}</div>}
        <div className="grid gap-1.5">
          {(payload as TooltipItem[]).map((item, index) => {
            const key = (item && (item.name ?? item.dataKey)) ?? String(index);
            const itemConfig = config[key ?? ""];

            const bgColor = itemConfig
              ? itemConfig.theme?.[themeKeyForClient()] ?? itemConfig.color
              : (item as TooltipItem).color;

            return (
              <div key={item.dataKey ?? key} className="flex items-center gap-2">
                {!hideIndicator && (
                  <span
                    className={indicatorClassName}
                    style={
                      {
                        "--color-bg": bgColor,
                        "--color-border": bgColor,
                      } as React.CSSProperties
                    }
                    aria-hidden
                  />
                )}

                {itemConfig?.icon && (
                  <span className="h-3 w-3 text-muted-foreground flex items-center justify-center">
                    {React.createElement(itemConfig.icon)}
                  </span>
                )}
                <span className="flex-1">{itemConfig?.label ?? trySanitize(item.name ?? item.dataKey)}</span>
                <span className="font-mono font-medium tabular-nums text-foreground">{trySanitize(item.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement, 
  React.ComponentProps<typeof RechartsPrimitive.Legend> & { className?: string }
>(({ className, payload, verticalAlign = "bottom" }, ref) => {
    const { config } = useChart();
    if (!payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
      >
        {payload.map((item) => {
          const key = item.value ?? String(item);
          const itemConfig = config[key];

          return (
            <div key={String(item.value)} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: itemConfig?.theme?.[themeKeyForClient()] ?? item.color,
                }}
                aria-hidden
              />
              {itemConfig?.icon && (
                <span className="h-3 w-3 text-muted-foreground flex items-center justify-center">
                  {React.createElement(itemConfig.icon)}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{itemConfig?.label ?? trySanitize(item.value)}</span>
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegend";

/* Hooks/utilities for theming and client-safe access */

function themeKeyForClient(): ThemeKey {
  return isBrowser() ? detectTheme() : "light";
}

function useThemeKey(): ThemeKey {
  const [key, setKey] = React.useState<ThemeKey>(() => themeKeyForClient());

  React.useEffect(() => {
    if (!isBrowser()) return;
    let mounted = true;
    const observer = new MutationObserver(() => {
      if (!mounted) return;
      setKey(detectTheme());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    // also observe body as fallback
    if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  return key;
}

export { ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
export type { ChartConfig };
