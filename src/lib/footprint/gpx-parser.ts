/**
 * GPX Parser for Footprint Feature
 * Parses GPX files exported from 一生足迹 and other GPS apps
 */

interface GPXTrackPoint {
    lat: number;
    lon: number;
    ele?: number;
    time?: Date;
}

interface GPXTrack {
    name?: string;
    description?: string;
    points: GPXTrackPoint[];
}

interface GPXParseResult {
    tracks: GPXTrack[];
    metadata: {
        name?: string;
        description?: string;
        author?: string;
        time?: Date;
    };
}

/**
 * Parse GPX XML string into structured data
 */
export function parseGPX(gpxContent: string): GPXParseResult {
    // Parse XML using DOMParser (works in browser) or JSDOM-like parsing
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxContent, "application/xml");

    // Check for parsing errors
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
        throw new Error(`Invalid GPX: ${parseError.textContent}`);
    }

    // Parse metadata
    const metadataNode = doc.querySelector("metadata");
    const metadata = {
        name: metadataNode?.querySelector("name")?.textContent || undefined,
        description: metadataNode?.querySelector("desc")?.textContent || undefined,
        author: metadataNode?.querySelector("author > name")?.textContent || undefined,
        time: metadataNode?.querySelector("time")?.textContent
            ? new Date(metadataNode.querySelector("time")!.textContent!)
            : undefined,
    };

    // Parse tracks
    const tracks: GPXTrack[] = [];
    const trkNodes = doc.querySelectorAll("trk");

    trkNodes.forEach((trk) => {
        const track: GPXTrack = {
            name: trk.querySelector("name")?.textContent || undefined,
            description: trk.querySelector("desc")?.textContent || undefined,
            points: [],
        };

        // Parse track segments
        const trksegs = trk.querySelectorAll("trkseg");
        trksegs.forEach((seg) => {
            const trkpts = seg.querySelectorAll("trkpt");
            trkpts.forEach((pt) => {
                const lat = parseFloat(pt.getAttribute("lat") || "0");
                const lon = parseFloat(pt.getAttribute("lon") || "0");
                const ele = pt.querySelector("ele")?.textContent
                    ? parseFloat(pt.querySelector("ele")!.textContent!)
                    : undefined;
                const time = pt.querySelector("time")?.textContent
                    ? new Date(pt.querySelector("time")!.textContent!)
                    : undefined;

                track.points.push({ lat, lon, ele, time });
            });
        });

        if (track.points.length > 0) {
            tracks.push(track);
        }
    });

    return { tracks, metadata };
}

/**
 * Calculate total distance from track points (Haversine formula)
 */
export function calculateDistance(points: GPXTrackPoint[]): number {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        if (prev && curr) {
            totalDistance += haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
        }
    }
    return totalDistance;
}

/**
 * Haversine distance calculation (returns km)
 */
function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Calculate duration from first to last point
 */
export function calculateDuration(points: GPXTrackPoint[]): number | null {
    if (points.length < 2) return null;

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (!firstPoint || !lastPoint) return null;

    const firstTime = firstPoint.time;
    const lastTime = lastPoint.time;
    if (!firstTime || !lastTime) return null;

    return Math.round((lastTime.getTime() - firstTime.getTime()) / 1000);
}

/**
 * Calculate elevation gain (total meters climbed)
 */
export function calculateElevationGain(points: GPXTrackPoint[]): number {
    let gain = 0;
    for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currPoint = points[i];
        if (!prevPoint || !currPoint) continue;
        const prev = prevPoint.ele;
        const curr = currPoint.ele;
        if (prev !== undefined && curr !== undefined && curr > prev) {
            gain += curr - prev;
        }
    }
    return gain;
}

/**
 * Encode track points to polyline format (for MapLibre)
 * Using simplified Google Polyline Algorithm
 */
export function encodePolyline(points: GPXTrackPoint[]): string {
    let encoded = "";
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
        const lat = Math.round(point.lat * 1e5);
        const lng = Math.round(point.lon * 1e5);

        encoded += encodeNumber(lat - prevLat);
        encoded += encodeNumber(lng - prevLng);

        prevLat = lat;
        prevLng = lng;
    }

    return encoded;
}

function encodeNumber(num: number): string {
    let sgn_num = num << 1;
    if (num < 0) {
        sgn_num = ~sgn_num;
    }

    let encoded = "";
    while (sgn_num >= 0x20) {
        encoded += String.fromCharCode((0x20 | (sgn_num & 0x1f)) + 63);
        sgn_num >>= 5;
    }
    encoded += String.fromCharCode(sgn_num + 63);

    return encoded;
}

/**
 * Decode polyline to array of coordinates
 */
export function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let b: number;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = result & 1 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = result & 1 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
}

/**
 * Simplify track by removing redundant points (Douglas-Peucker algorithm)
 */
export function simplifyTrack(
    points: GPXTrackPoint[],
    tolerance: number = 0.0001
): GPXTrackPoint[] {
    if (points.length <= 2) return points;

    // Find the point with the maximum distance
    let maxDistance = 0;
    let maxIndex = 0;

    const start = points[0];
    const end = points[points.length - 1];
    if (!start || !end) return points;

    for (let i = 1; i < points.length - 1; i++) {
        const point = points[i];
        if (!point) continue;
        const dist = perpendicularDistance(point, start, end);
        if (dist > maxDistance) {
            maxDistance = dist;
            maxIndex = i;
        }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
        const left = simplifyTrack(points.slice(0, maxIndex + 1), tolerance);
        const right = simplifyTrack(points.slice(maxIndex), tolerance);

        return [...left.slice(0, -1), ...right];
    }

    return [start, end];
}

function perpendicularDistance(
    point: GPXTrackPoint,
    lineStart: GPXTrackPoint,
    lineEnd: GPXTrackPoint
): number {
    const dx = lineEnd.lon - lineStart.lon;
    const dy = lineEnd.lat - lineStart.lat;

    if (dx === 0 && dy === 0) {
        return Math.sqrt(
            Math.pow(point.lon - lineStart.lon, 2) +
            Math.pow(point.lat - lineStart.lat, 2)
        );
    }

    const t =
        ((point.lon - lineStart.lon) * dx + (point.lat - lineStart.lat) * dy) /
        (dx * dx + dy * dy);

    const clampedT = Math.max(0, Math.min(1, t));

    const closestX = lineStart.lon + clampedT * dx;
    const closestY = lineStart.lat + clampedT * dy;

    return Math.sqrt(
        Math.pow(point.lon - closestX, 2) + Math.pow(point.lat - closestY, 2)
    );
}
