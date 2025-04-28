// Type definitions for AMAP JS API 1.4.x
// Project: https://lbs.amap.com/api/javascript-api/summary/
// Definitions by: Vitan <https://github.com/vitanlee>
//                 Gavin <https://github.com/Gavinty>
//                 We O <https://github.com/cloudmoves>
//                 Sen <https://github.com/Sen-Takatsuki>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.8

// Note: These are augmented definitions to supplement the potentially incomplete
// @types/amap-js-api package for version 1.4.x, based on common usage and errors.
// For full accuracy, refer to the official AMap JS API 1.4 documentation.

declare namespace AMap {

    // --- Basic Types (Assuming some exist in @types/amap-js-api) ---
    // Re-declare or ensure existence if needed
    class LngLat {
        constructor(lng: number, lat: number);
        getLng(): number;
        getLat(): number;
        offset(w: number, s: number): LngLat;
        distance(lnglat: LngLat | LngLat[]): number; // Distance from current point to lnglat
        equals(lnglat: LngLat): boolean;
        toString(): string;
    }

    class Map {
        constructor(container: string | HTMLDivElement, opts?: MapOptions);
        addControl(control: any): void; // Control type needs specifics (Scale, ToolBar)
        removeControl(control: any): void;
        add(overlays: Overlay | Overlay[]): void;
        remove(overlays: Overlay | Overlay[]): void;
        setMap(map: Map | null): void; // Usually on Overlays, but maybe needed here?
        setFitView(overlays?: Overlay | Overlay[], immediately?: boolean, avoid?: [number, number, number, number], maxZoom?: number): void;
        getAllOverlays(type?: 'marker' | 'polyline' | 'polygon' | string): Overlay[];
        clearMap(): void;
        destroy(): void;
        plugin(name: string | string[], callback: () => void): void;
        on(eventName: string, handler: (event: any) => void, context?: any): void;
        off(eventName: string, handler: (event: any) => void, context?: any): void;
        setCenter(position: LngLat | [number, number]): void;
        // 添加resize方法，用于处理地图容器大小变化
        resize(): void;
        // Add other methods as needed: getCenter, getZoom, setZoom etc.
    }

    interface MapOptions {
        view?: View2D;
        layers?: Layer[];
        zoom?: number;
        center?: LngLat | [number, number];
        labelzIndex?: number;
        zooms?: [number, number];
        lang?: 'zh_cn' | 'en' | 'zh_en';
        mapStyle?: string;
        resizeEnable?: boolean;
        pitch?: number;
        // Add other map options...
    }

    interface View2D {
        center?: LngLat;
        zoom?: number;
        rotation?: number;
        pitch?: number;
    }

    type Layer = any; // TileLayer, etc.
    type Overlay = any; // Marker, Polyline, Polygon, etc.

    class Icon {
        constructor(options?: IconOptions);
    }

    interface IconOptions {
        size?: Size;
        imageOffset?: Pixel;
        image?: string;
        imageSize?: Size;
    }

    class Size {
        constructor(width: number, height: number);
        getWidth(): number;
        getHeight(): number;
        toString(): string;
    }

    class Pixel {
        constructor(x: number, y: number);
        getX(): number;
        getY(): number;
        equals(point: Pixel): boolean;
        toString(): string;
    }

    class Marker {
        constructor(options?: MarkerOptions);
        setMap(map: Map | null): void;
        getPosition(): LngLat;
        setPosition(lnglat: LngLat | [number, number]): void;
        setIcon(icon: string | Icon): void;
        setLabel(label: { content: string, offset?: Pixel }): void;
        on(eventName: string, handler: (event: any) => void, context?: any): void;
        // Add other marker methods/properties...
    }

    interface MarkerOptions {
        map?: Map;
        position?: LngLat | [number, number];
        icon?: string | Icon;
        label?: { content: string, offset?: Pixel };
        title?: string;
        clickable?: boolean;
        content?: string | HTMLElement;
        offset?: Pixel;
        zIndex?: number;
        // Add other marker options...
    }

    class Polyline {
        constructor(options?: PolylineOptions);
        setMap(map: Map | null): void;
        setPath(path: LngLat[] | LngLat[][]): void;
        getPath(): LngLat[] | LngLat[][];
        setOptions(options: PolylineOptions): void;
        getOptions(): PolylineOptions;
        // Add other polyline methods...
    }

    // --- Missing/Augmented Options and Classes based on Errors ---

    // PolylineOptions (Augmented/Declared)
    interface PolylineOptions {
        map?: Map;
        path?: LngLat[] | LngLat[][];
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        strokeStyle?: "solid" | "dashed" | string;
        strokeDasharray?: number[];
        lineJoin?: "miter" | "round" | "bevel";
        lineCap?: "butt" | "round" | "square";
        zIndex?: number;
        showDir?: boolean;
        // ... other potential PolylineOptions properties
    }

    // Scale Control (Declared)
    class Scale {
        constructor(options?: ScaleOptions);
        show(): void;
        hide(): void;
    }
    interface ScaleOptions {
        visible?: boolean;
        position?: 'LT' | 'RT' | 'LB' | 'RB';
        offset?: Pixel;
        // ... other scale options
    }

    // ToolBar Control (Declared)
    class ToolBar {
        constructor(options?: ToolBarOptions);
        show(): void;
        hide(): void;
    }
    interface ToolBarOptions {
        visible?: boolean;
        position?: 'LT' | 'RT' | 'LB' | 'RB' | { top?: string; left?: string; right?: string; bottom?: string };
        offset?: Pixel;
        ruler?: boolean; // For 1.4
        direction?: boolean; // For 1.4
        locate?: boolean;
        // ... other toolbar options
    }

    // --- Services (Declared/Augmented) ---

    // DistrictSearch
    namespace DistrictSearch {
        interface Options {
            level?: 'country' | 'province' | 'city' | 'district';
            subdistrict?: number;
            extensions?: 'base' | 'all';
            showbiz?: boolean;
        }
        type SearchStatus = 'complete' | 'error' | 'no_data';
        interface DistrictItem {
            name: string;
            adcode: string;
            level: string;
            center: LngLat; // Type might be [number, number] in some results
            citycode?: string[]; // Often an array
            boundaries?: LngLat[][]; // For extensions: 'all'
            districts?: DistrictItem[];
        }
        interface SearchResult {
            info: string;
            districtList: DistrictItem[]; // API v1.4 uses districtList
        }
    }
    class DistrictSearch {
        constructor(options?: DistrictSearch.Options);
        search(keyword: string, callback: (status: DistrictSearch.SearchStatus, result: DistrictSearch.SearchResult | string) => void): void;
        setLevel(level: 'country' | 'province' | 'city' | 'district'): void;
        setSubdistrict(subdistrict: number): void;
    }

    // Geocoder
    namespace Geocoder {
        interface Options {
            city?: string;
            radius?: number;
            lang?: 'zh_cn' | 'en';
            batch?: boolean;
            extensions?: 'base' | 'all';
        }
        type SearchStatus = 'complete' | 'error' | 'no_data';
        interface GeocodeResult {
            info: string;
            resultNum: number;
            geocodes: Geocode[];
        }
        interface ReGeocodeResult {
             info: string;
             regeocode: ReGeocode;
        }
        interface Geocode {
            addressComponent: AddressComponent;
            formattedAddress: string;
            location: LngLat;
            adcode: string;
            level: string;
            // ... other properties
        }
         interface ReGeocode {
            addressComponent: AddressComponent;
            formattedAddress: string;
            pois: Poi[];
            roads: Road[];
            crosses: Cross[];
            // ... other properties
        }
        interface AddressComponent {
            citycode: string;
            adcode: string;
            businessAreas: BusinessArea[];
            neighborhoodType: string;
            neighborhood: string;
            building: string;
            buildingType: string;
            street: string;
            streetNumber: string;
            province: string;
            city: string;
            district: string;
            township: string;
        }
        interface BusinessArea {
            id: string;
            name: string;
            location: LngLat;
        }
        interface Poi {
            // ... Poi properties
        }
        interface Road {
            // ... Road properties
        }
        interface Cross {
            // ... Cross properties
        }
    }
    class Geocoder {
        constructor(options?: Geocoder.Options);
        getLocation(address: string, callback: (status: Geocoder.SearchStatus, result: Geocoder.GeocodeResult | string) => void): void;
        getAddress(location: LngLat | [number, number], callback: (status: Geocoder.SearchStatus, result: Geocoder.ReGeocodeResult | string) => void): void;
    }

    // Driving Route Service
    namespace Driving {
        interface Options {
            map?: Map;
            policy?: number | string; // Use constants like AMap.DrivingPolicy.LEAST_TIME
            ferry?: boolean;
            province?: string;
            waypoints?: LngLat[];
            showTraffic?: boolean;
            hideMarkers?: boolean;
            strokeStyle?: "solid" | "dashed" | string;
            strokeColor?: string;
            strokeWeight?: number;
            outlineColor?: string;
            isOutline?: boolean;
            outlineWidth?: number;
            wayPointStyle?: {
                width?: number;
                height?: number;
                radius?: number;
                fillColor?: string;
                strokeColor?: string;
                strokeWeight?: number;
                strokeOpacity?: number;
            };
            // ... other options
        }
        type DrivingStatus = 'complete' | 'error' | 'no_data';
        interface DrivingResult {
            info: string;
            origin: LngLat;
            destination: LngLat;
            start: Poi;
            end: Poi;
            waypoints?: Poi[];
            taxi_cost?: number;
            routes: Route[];
            // ... other result properties
        }
        interface Route {
            distance: number;
            time: number;
            policy: string;
            tolls: number;
            toll_distance: number;
            steps: Step[];
            // ... other route properties
        }
        interface Step {
            start_location: LngLat;
            end_location: LngLat;
            instruction: string;
            action: string;
            assistant_action: string;
            orientation: string;
            road: string;
            distance: number;
            time: number;
            path: LngLat[];
            // ... other step properties
        }
        interface Poi {
            // ... Poi properties
        }
        // Constants for policy (example)
        const DrivingPolicy: {
            LEAST_TIME: number;
            LEAST_FEE: number;
            LEAST_DISTANCE: number;
            // ... other policies
        };
    }
    class Driving {
        constructor(options?: Driving.Options);
        search(origin: LngLat | [number, number] | string, destination: LngLat | [number, number] | string, opts?: { waypoints: LngLat[] }, callback?: (status: Driving.DrivingStatus, result: Driving.DrivingResult | string) => void): void;
        search(points: {origin: LngLat, destination: LngLat, waypoints?: LngLat[]}[], callback: (status: Driving.DrivingStatus, result: Driving.DrivingResult | string) => void): void; // Batch search
        clear(): void;
        setPolicy(policy: number | string): void;
        // 添加事件方法
        on(eventName: string, callback: Function): void;
        off(eventName: string, callback: Function): void;
        // ... other methods
    }

    // --- Events (Example for Map click) ---
    interface MapsEvent<N extends string = string, T = any> {
        type: N;
        target: T;
        lnglat?: LngLat; // For click events
        pixel?: Pixel; // For click events
        // ... other event properties
    }

    // --- Geometry Utilities (Assuming exists or declare if needed) ---
    namespace GeometryUtil {
        function distance(p1: LngLat | [number, number], p2: LngLat | [number, number]): number;
        // ... other utils
    }

    // --- BezierCurve (If used directly) ---
    class BezierCurve {
        constructor(options?: BezierCurveOptions);
        // ... methods
    }
    interface BezierCurveOptions {
        map?: Map;
        path?: (LngLat | [number, number])[];
        // ... other options similar to PolylineOptions
    }

    // --- InfoWindow --- (If needed)
    class InfoWindow {
        constructor(options?: InfoWindowOptions);
        open(map: Map, pos: LngLat | [number, number]): void;
        close(): void;
        setContent(content: string | HTMLElement): void;
        setPosition(lnglat: LngLat | [number, number]): void;
        // ... methods
    }
    interface InfoWindowOptions {
        isCustom?: boolean;
        content?: string | HTMLElement;
        size?: Size;
        offset?: Pixel;
        position?: LngLat | [number, number];
        autoMove?: boolean;
        closeWhenClickMap?: boolean;
        // ... options
    }

    // 添加Bounds类定义
    class Bounds {
        constructor(southWest?: LngLat, northEast?: LngLat);
        contains(point: LngLat): boolean;
        getCenter(): LngLat;
        getSouthWest(): LngLat;
        getNorthEast(): LngLat;
        toString(): string;
        extend(point: LngLat): Bounds; // 添加extend方法
    }

}

// Export the namespace to be usable
export = AMap;
export as namespace AMap; 