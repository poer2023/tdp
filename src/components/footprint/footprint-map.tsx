"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { Map, MapRoute, MapControls, MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map";
import { decodePolyline } from "@/lib/footprint/gpx-parser";
import type { FootprintType } from "@/lib/footprint/footprint";
import type MapLibreGL from "maplibre-gl";
import { Flame, Route, MapPin } from "lucide-react";

interface FlyToTarget {
    type: 'polyline' | 'point';
    id: string;
    lat?: number;
    lng?: number;
}

interface CityMarker {
    id: string;
    code: string;
    name: string;
    nameEn: string | null;
    lat: number;
    lng: number;
    visits: number;
    firstVisit: string | null;
    lastVisit: string | null;
}

interface FootprintMapProps {
    polylines: Array<{
        id: string;
        type: FootprintType;
        polyline: string;
        startTime: Date;
    }>;
    selectedId?: string | null;
    onMapReady?: (flyTo: (target: FlyToTarget) => void) => void;
}

const typeRouteColors: Record<FootprintType, string> = {
    WALK: "#22c55e",
    RUN: "#f97316",
    BIKE: "#06b6d4",
    DRIVE: "#3b82f6",
    TRANSIT: "#a855f7",
    FLIGHT: "#6366f1",
    OTHER: "#78716c",
};

export function FootprintMap({ polylines, selectedId, onMapReady }: FootprintMapProps) {
    const mapRef = useRef<MapLibreGL.Map | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showCities, setShowCities] = useState(true);
    const [heatmapLoaded, setHeatmapLoaded] = useState(false);
    const [cities, setCities] = useState<CityMarker[]>([]);

    // Decode all polylines and calculate center
    const { routes, center, hasData, routeById } = useMemo(() => {
        if (polylines.length === 0) {
            return {
                routes: [],
                center: [116.4, 39.9] as [number, number],
                hasData: false,
                routeById: {} as Record<string, [number, number][]>,
            };
        }

        const decodedRoutes = polylines.map((p) => ({
            id: p.id,
            type: p.type,
            coordinates: decodePolyline(p.polyline),
        }));

        const routeMap: Record<string, [number, number][]> = {};
        decodedRoutes.forEach((r) => {
            routeMap[r.id] = r.coordinates;
        });

        let totalLng = 0;
        let totalLat = 0;
        let count = 0;

        for (const route of decodedRoutes) {
            for (const [lng, lat] of route.coordinates) {
                totalLng += lng;
                totalLat += lat;
                count++;
            }
        }

        const centerLng = count > 0 ? totalLng / count : 116.4;
        const centerLat = count > 0 ? totalLat / count : 39.9;

        return {
            routes: decodedRoutes,
            center: [centerLng, centerLat] as [number, number],
            hasData: true,
            routeById: routeMap,
        };
    }, [polylines]);

    // Load cities on mount
    useEffect(() => {
        const loadCities = async () => {
            try {
                const res = await fetch("/api/footprint/cities");
                const geojson = await res.json();
                const cityList: CityMarker[] = geojson.features.map((f: {
                    geometry: { coordinates: number[] };
                    properties: {
                        id: string;
                        code: string;
                        name: string;
                        nameEn: string | null;
                        visits: number;
                        firstVisit: string | null;
                        lastVisit: string | null;
                    };
                }) => ({
                    id: f.properties.id,
                    code: f.properties.code,
                    name: f.properties.name,
                    nameEn: f.properties.nameEn,
                    lat: f.geometry.coordinates[1],
                    lng: f.geometry.coordinates[0],
                    visits: f.properties.visits,
                    firstVisit: f.properties.firstVisit,
                    lastVisit: f.properties.lastVisit,
                }));
                setCities(cityList);
            } catch (err) {
                console.error("Failed to load cities:", err);
            }
        };
        loadCities();
    }, []);

    // Load heatmap data when toggled on
    useEffect(() => {
        if (!showHeatmap || !mapRef.current || heatmapLoaded) return;

        const map = mapRef.current;

        const loadHeatmap = async () => {
            try {
                const res = await fetch("/api/footprint/heatmap");
                const geojson = await res.json();

                if (!map.getSource("heatmap-source")) {
                    map.addSource("heatmap-source", { type: "geojson", data: geojson });
                }

                if (!map.getLayer("heatmap-layer")) {
                    map.addLayer({
                        id: "heatmap-layer",
                        type: "heatmap",
                        source: "heatmap-source",
                        paint: {
                            "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 0, 0, 10, 1],
                            "heatmap-intensity": 1,
                            "heatmap-color": [
                                "interpolate", ["linear"], ["heatmap-density"],
                                0, "rgba(0,0,0,0)",
                                0.2, "#22c55e",
                                0.4, "#84cc16",
                                0.6, "#eab308",
                                0.8, "#f97316",
                                1, "#ef4444"
                            ],
                            "heatmap-radius": 30,
                            "heatmap-opacity": 0.7,
                        },
                    });
                }

                setHeatmapLoaded(true);
            } catch (err) {
                console.error("Failed to load heatmap:", err);
            }
        };

        loadHeatmap();
    }, [showHeatmap, heatmapLoaded]);

    // Toggle heatmap layer visibility
    useEffect(() => {
        if (!mapRef.current || !heatmapLoaded) return;
        const map = mapRef.current;

        if (map.getLayer("heatmap-layer")) {
            map.setLayoutProperty("heatmap-layer", "visibility", showHeatmap ? "visible" : "none");
        }
    }, [showHeatmap, heatmapLoaded]);

    // Provide flyTo function to parent
    useEffect(() => {
        if (!onMapReady) return;

        const flyTo = (target: FlyToTarget) => {
            if (!mapRef.current) return;

            if (target.type === 'polyline') {
                const coords = routeById[target.id];
                if (!coords || coords.length === 0) return;

                let minLng = Infinity, maxLng = -Infinity;
                let minLat = Infinity, maxLat = -Infinity;

                for (const [lng, lat] of coords) {
                    minLng = Math.min(minLng, lng);
                    maxLng = Math.max(maxLng, lng);
                    minLat = Math.min(minLat, lat);
                    maxLat = Math.max(maxLat, lat);
                }

                mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, duration: 1000 });
            } else if (target.type === 'point' && target.lat && target.lng) {
                mapRef.current.flyTo({ center: [target.lng, target.lat], zoom: 12, duration: 1000 });
            }
        };

        onMapReady(flyTo);
    }, [onMapReady, routeById]);

    const handleMapLoad = (map: MapLibreGL.Map) => {
        mapRef.current = map;
    };

    return (
        <div className="relative h-[400px] overflow-hidden rounded-2xl border border-stone-200 shadow-sm dark:border-stone-700">
            {/* View Mode Toggle */}
            <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-lg bg-white/90 p-1 shadow-md backdrop-blur dark:bg-stone-800/90">
                <button
                    onClick={() => setShowHeatmap(false)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${!showHeatmap
                        ? "bg-sage-500 text-white"
                        : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
                        }`}
                >
                    <Route className="h-3.5 w-3.5" />
                    路线
                </button>
                <button
                    onClick={() => setShowHeatmap(true)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${showHeatmap
                        ? "bg-orange-500 text-white"
                        : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
                        }`}
                >
                    <Flame className="h-3.5 w-3.5" />
                    热力图
                </button>
                <button
                    onClick={() => setShowCities(!showCities)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${showCities
                        ? "bg-purple-500 text-white"
                        : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
                        }`}
                >
                    <MapPin className="h-3.5 w-3.5" />
                    城市
                </button>
            </div>

            <Map
                center={center}
                zoom={hasData ? 5 : 4}
                scrollZoom={true}
                doubleClickZoom={true}
                className="h-full w-full"
                onLoad={handleMapLoad}
            >
                {/* Routes - show when not in heatmap mode */}
                {!showHeatmap && routes.map((route) => (
                    <MapRoute
                        key={route.id}
                        coordinates={route.coordinates}
                        color={typeRouteColors[route.type]}
                        width={selectedId === route.id ? 5 : 3}
                        opacity={selectedId && selectedId !== route.id ? 0.3 : 0.8}
                    />
                ))}

                {/* City Markers */}
                {showCities && cities.map((city) => (
                    <MapMarker key={city.id} longitude={city.lng} latitude={city.lat}>
                        <MarkerContent>
                            <div className="flex flex-col items-center">
                                <div
                                    className="flex items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold shadow-lg"
                                    style={{
                                        width: Math.max(24, 16 + city.visits * 4),
                                        height: Math.max(24, 16 + city.visits * 4),
                                    }}
                                >
                                    {city.visits}
                                </div>
                                <div className="mt-1 px-1 py-0.5 rounded bg-white/90 dark:bg-stone-800/90 text-xs font-medium shadow text-stone-800 dark:text-stone-200">
                                    {city.name}
                                </div>
                            </div>
                        </MarkerContent>
                        <MarkerPopup>
                            <div className="p-2 min-w-[120px]">
                                <div className="font-semibold">{city.name}</div>
                                {city.nameEn && <div className="text-xs text-stone-500">{city.nameEn}</div>}
                                <div className="mt-1 text-sm">访问 {city.visits} 次</div>
                                {city.lastVisit && (
                                    <div className="text-xs text-stone-400">
                                        最近: {new Date(city.lastVisit).toLocaleDateString("zh-CN")}
                                    </div>
                                )}
                            </div>
                        </MarkerPopup>
                    </MapMarker>
                ))}

                <MapControls position="bottom-right" showZoom showFullscreen />
            </Map>
        </div>
    );
}
