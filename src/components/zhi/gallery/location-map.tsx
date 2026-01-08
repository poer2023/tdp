"use client";

import dynamic from "next/dynamic";

interface LocationMapProps {
    lat: number;
    lng: number;
    _isDark?: boolean;
    height?: string;
    showZoomControl?: boolean;
}

/**
 * Dynamically imported map component to avoid SSR issues
 * Uses MapLibre GL for rendering
 */
export const LocationMap = dynamic(
    () => import("@/components/ui/map").then((mod) => {
        const { Map, MapMarker, MarkerContent, MapControls } = mod;

        return function LocationMapInner({
            lat,
            lng,
            _isDark,
            height = "160px",
            showZoomControl = true
        }: LocationMapProps) {
            return (
                <div style={{ height, width: "100%" }}>
                    <Map
                        center={[lng, lat]}
                        zoom={13}
                        scrollZoom={true}
                        doubleClickZoom={true}
                        className="h-full w-full"
                    >
                        <MapMarker longitude={lng} latitude={lat}>
                            <MarkerContent>
                                <div className="relative h-6 w-6 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
                            </MarkerContent>
                        </MapMarker>
                        {showZoomControl && <MapControls position="top-right" showZoom />}
                    </Map>
                </div>
            );
        };
    }),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full w-full items-center justify-center bg-stone-100 dark:bg-stone-800">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
        )
    }
);
