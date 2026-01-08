"use client";

import MapLibreGL, {
    type PopupOptions,
    type MarkerOptions,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import {
    createContext,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X, Minus, Plus, Locate, Maximize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Map Context
// ============================================================================

type MapContextValue = {
    map: MapLibreGL.Map | null;
    isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error("useMap must be used within a Map component");
    }
    return context;
}

// ============================================================================
// Map Styles
// ============================================================================

const mapStyles = {
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

// ============================================================================
// Map Component
// ============================================================================

type MapProps = {
    children?: ReactNode;
    className?: string;
    onLoad?: (map: MapLibreGL.Map) => void;
} & Omit<MapLibreGL.MapOptions, "container">;

const DefaultLoader = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="flex gap-1">
            <span className="size-1.5 animate-pulse rounded-full bg-stone-400" />
            <span className="size-1.5 animate-pulse rounded-full bg-stone-400 [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-stone-400 [animation-delay:300ms]" />
        </div>
    </div>
);

function Map({ children, className, onLoad, ...props }: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapLibreGL.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isStyleLoaded, setIsStyleLoaded] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!containerRef.current) return;

        const mapStyle =
            resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

        const mapInstance = new MapLibreGL.Map({
            container: containerRef.current,
            style: mapStyle,
            attributionControl: false,
            ...props,
        });

        const styleDataHandler = () => setIsStyleLoaded(true);
        const loadHandler = () => {
            setIsLoaded(true);
            onLoad?.(mapInstance);
        };

        mapInstance.on("load", loadHandler);
        mapInstance.on("styledata", styleDataHandler);
        mapRef.current = mapInstance;

        return () => {
            mapInstance.off("load", loadHandler);
            mapInstance.off("styledata", styleDataHandler);
            mapInstance.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle theme changes
    useEffect(() => {
        if (mapRef.current) {
            setIsStyleLoaded(false);
            mapRef.current.setStyle(
                resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light,
                { diff: true }
            );
        }
    }, [resolvedTheme]);

    // Handle center changes - fly to new location instead of recreating the map
    useEffect(() => {
        if (mapRef.current && props.center) {
            mapRef.current.flyTo({
                center: props.center as [number, number],
                duration: 500,
            });
        }
    }, [props.center]);

    const isLoading = !isLoaded && !isStyleLoaded;

    return (
        <MapContext.Provider
            value={{ map: mapRef.current, isLoaded: isLoaded && isStyleLoaded }}
        >
            <div
                ref={containerRef}
                className={cn("relative h-full w-full", className)}
            >
                {isLoading && <DefaultLoader />}
                {children}
            </div>
        </MapContext.Provider>
    );
}

// ============================================================================
// Marker Context
// ============================================================================

// ============================================================================
// Marker Context
// ============================================================================

type MarkerContextValue = {
    markerRef: React.RefObject<MapLibreGL.Marker | null>;
    markerElement: HTMLDivElement | null;
    map: MapLibreGL.Map | null;
    isReady: boolean;
};

const MarkerContext = createContext<MarkerContextValue | null>(null);

function useMarkerContext() {
    const context = useContext(MarkerContext);
    if (!context) {
        throw new Error("Marker components must be used within MapMarker");
    }
    return context;
}

// ============================================================================
// MapMarker Component
// ============================================================================

type MapMarkerProps = {
    longitude: number;
    latitude: number;
    children: ReactNode;
    onClick?: (e: MouseEvent) => void;
    onMouseEnter?: (e: MouseEvent) => void;
    onMouseLeave?: (e: MouseEvent) => void;
} & Omit<MarkerOptions, "element">;

function MapMarker({
    longitude,
    latitude,
    children,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...markerOptions
}: MapMarkerProps) {
    const { map, isLoaded } = useMap();
    const markerRef = useRef<MapLibreGL.Marker | null>(null);
    const [markerElement, setMarkerElement] = useState<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!isLoaded || !map) return;

        const container = document.createElement("div");
        setMarkerElement(container);

        const marker = new MapLibreGL.Marker({
            ...markerOptions,
            element: container,
        })
            .setLngLat([longitude, latitude])
            .addTo(map);

        markerRef.current = marker;

        if (onClick) container.addEventListener("click", onClick);
        if (onMouseEnter) container.addEventListener("mouseenter", onMouseEnter);
        if (onMouseLeave) container.addEventListener("mouseleave", onMouseLeave);

        setIsReady(true);

        return () => {
            if (onClick) container.removeEventListener("click", onClick);
            if (onMouseEnter)
                container.removeEventListener("mouseenter", onMouseEnter);
            if (onMouseLeave)
                container.removeEventListener("mouseleave", onMouseLeave);
            marker.remove();
            markerRef.current = null;
            setMarkerElement(null);
            setIsReady(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded]);

    useEffect(() => {
        markerRef.current?.setLngLat([longitude, latitude]);
    }, [longitude, latitude]);

    return (
        <MarkerContext.Provider
            value={{ markerRef, markerElement, map, isReady }}
        >
            {children}
        </MarkerContext.Provider>
    );
}

// ============================================================================
// MarkerContent Component
// ============================================================================

type MarkerContentProps = {
    children?: ReactNode;
    className?: string;
};

function MarkerContent({ children, className }: MarkerContentProps) {
    const { markerElement, isReady } = useMarkerContext();

    if (!isReady || !markerElement) return null;

    return createPortal(
        <div className={cn("relative cursor-pointer", className)}>
            {children || <DefaultMarkerIcon />}
        </div>,
        markerElement
    );
}

function DefaultMarkerIcon() {
    return (
        <div className="relative h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
    );
}

// ============================================================================
// MarkerPopup Component
// ============================================================================

type MarkerPopupProps = {
    children: ReactNode;
    className?: string;
    closeButton?: boolean;
} & Omit<PopupOptions, "className">;

function MarkerPopup({
    children,
    className,
    closeButton = false,
    ...popupOptions
}: MarkerPopupProps) {
    const { markerRef, isReady } = useMarkerContext();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const popupRef = useRef<MapLibreGL.Popup | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!isReady || !markerRef.current) return;

        const container = document.createElement("div");
        containerRef.current = container;

        const popup = new MapLibreGL.Popup({
            offset: 16,
            ...popupOptions,
            closeButton: false,
        }).setDOMContent(container);

        popupRef.current = popup;
        markerRef.current.setPopup(popup);
        setMounted(true);

        return () => {
            popup.remove();
            popupRef.current = null;
            containerRef.current = null;
            setMounted(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady]);

    const handleClose = () => popupRef.current?.remove();

    if (!mounted || !containerRef.current) return null;

    return createPortal(
        <div
            className={cn(
                "animate-in fade-in-0 zoom-in-95 relative rounded-xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100",
                className
            )}
        >
            {closeButton && (
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70 focus:outline-none"
                    aria-label="Close popup"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            {children}
        </div>,
        containerRef.current
    );
}

// ============================================================================
// MarkerTooltip Component
// ============================================================================

type MarkerTooltipProps = {
    children: ReactNode;
    className?: string;
} & Omit<PopupOptions, "className">;

function MarkerTooltip({
    children,
    className,
    ...popupOptions
}: MarkerTooltipProps) {
    const { markerRef, markerElement, map, isReady } = useMarkerContext();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const popupRef = useRef<MapLibreGL.Popup | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (!isReady || !markerRef.current || !markerElement || !map)
            return;

        const container = document.createElement("div");
        containerRef.current = container;

        const popup = new MapLibreGL.Popup({
            offset: 16,
            ...popupOptions,
            closeOnClick: true,
            closeButton: false,
        }).setDOMContent(container);

        popupRef.current = popup;

        // Note: markerElement is guaranteed to be set if isReady is true and we checked it
        const element = markerElement;
        const marker = markerRef.current;

        const handleMouseEnter = () => {
            popup.setLngLat(marker.getLngLat()).addTo(map);
        };
        const handleMouseLeave = () => popup.remove();

        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);
        setMounted(true);

        return () => {
            element.removeEventListener("mouseenter", handleMouseEnter);
            element.removeEventListener("mouseleave", handleMouseLeave);
            popup.remove();
            popupRef.current = null;
            containerRef.current = null;
            setMounted(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, map]);

    if (!mounted || !containerRef.current) return null;

    return createPortal(
        <div
            className={cn(
                "animate-in fade-in-0 zoom-in-95 rounded-md bg-stone-900 px-2 py-1 text-xs text-white shadow-md dark:bg-white dark:text-stone-900",
                className
            )}
        >
            {children}
        </div>,
        containerRef.current
    );
}

// ============================================================================
// MapControls Component
// ============================================================================

type MapControlsProps = {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    showZoom?: boolean;
    showLocate?: boolean;
    showFullscreen?: boolean;
    className?: string;
    onLocate?: (coords: { longitude: number; latitude: number }) => void;
};

const positionClasses = {
    "top-left": "top-3 left-3",
    "top-right": "top-3 right-3",
    "bottom-left": "bottom-3 left-3",
    "bottom-right": "bottom-3 right-3",
};

function ControlGroup({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-md dark:border-stone-700 dark:bg-stone-800 [&>button:not(:last-child)]:border-b [&>button:not(:last-child)]:border-stone-200 dark:[&>button:not(:last-child)]:border-stone-700">
            {children}
        </div>
    );
}

function ControlButton({
    onClick,
    label,
    children,
    disabled = false,
}: {
    onClick: () => void;
    label: string;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            type="button"
            className={cn(
                "flex size-9 items-center justify-center text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700",
                disabled && "pointer-events-none cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

function MapControls({
    position = "bottom-right",
    showZoom = true,
    showLocate = false,
    showFullscreen = false,
    className,
    onLocate,
}: MapControlsProps) {
    const { map, isLoaded } = useMap();
    const [waitingForLocation, setWaitingForLocation] = useState(false);

    if (!isLoaded) return null;

    const handleZoomIn = () => map?.zoomTo(map.getZoom() + 1, { duration: 300 });
    const handleZoomOut = () => map?.zoomTo(map.getZoom() - 1, { duration: 300 });

    const handleLocate = () => {
        setWaitingForLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        longitude: position.coords.longitude,
                        latitude: position.coords.latitude,
                    };
                    map?.flyTo({
                        center: [coords.longitude, coords.latitude],
                        zoom: 14,
                        duration: 1500,
                    });
                    onLocate?.(coords);
                    setWaitingForLocation(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setWaitingForLocation(false);
                }
            );
        }
    };

    const handleFullscreen = () => {
        const container = map?.getContainer();
        if (!container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    };

    return (
        <div
            className={cn(
                "absolute z-10 flex flex-col gap-2",
                positionClasses[position],
                className
            )}
        >
            {showZoom && (
                <ControlGroup>
                    <ControlButton onClick={handleZoomIn} label="Zoom in">
                        <Plus className="size-4" />
                    </ControlButton>
                    <ControlButton onClick={handleZoomOut} label="Zoom out">
                        <Minus className="size-4" />
                    </ControlButton>
                </ControlGroup>
            )}
            {showLocate && (
                <ControlGroup>
                    <ControlButton
                        onClick={handleLocate}
                        label="Find my location"
                        disabled={waitingForLocation}
                    >
                        {waitingForLocation ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Locate className="size-4" />
                        )}
                    </ControlButton>
                </ControlGroup>
            )}
            {showFullscreen && (
                <ControlGroup>
                    <ControlButton onClick={handleFullscreen} label="Toggle fullscreen">
                        <Maximize className="size-4" />
                    </ControlButton>
                </ControlGroup>
            )}
        </div>
    );
}

// ============================================================================
// MapRoute Component
// ============================================================================

type MapRouteProps = {
    coordinates: [number, number][];
    color?: string;
    width?: number;
    opacity?: number;
    dashArray?: [number, number];
};

function MapRoute({
    coordinates,
    color = "#4285F4",
    width = 3,
    opacity = 0.8,
    dashArray,
}: MapRouteProps) {
    const { map, isLoaded } = useMap();
    const id = useId();
    const sourceId = `route-source-${id}`;
    const layerId = `route-layer-${id}`;

    useEffect(() => {
        if (!isLoaded || !map || coordinates.length < 2) return;

        const addRoute = () => {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);

            map.addSource(sourceId, {
                type: "geojson",
                data: {
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates },
                },
            });

            map.addLayer({
                id: layerId,
                type: "line",
                source: sourceId,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                    "line-color": color,
                    "line-width": width,
                    "line-opacity": opacity,
                    ...(dashArray && { "line-dasharray": dashArray }),
                },
            });
        };

        addRoute();

        return () => {
            try {
                if (map.getLayer(layerId)) map.removeLayer(layerId);
                if (map.getSource(sourceId)) map.removeSource(sourceId);
            } catch {
                // ignore
            }
        };
    }, [
        isLoaded,
        map,
        coordinates,
        color,
        width,
        opacity,
        dashArray,
        sourceId,
        layerId,
    ]);

    return null;
}

// ============================================================================
// Exports
// ============================================================================

export {
    Map,
    useMap,
    MapMarker,
    MarkerContent,
    MarkerPopup,
    MarkerTooltip,
    MapControls,
    MapRoute,
};
