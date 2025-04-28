/**
 * 高德地图类型声明文件 - 统一声明解决类型错误
 */
declare namespace AMap {
  class Map {
    constructor(container: string | HTMLElement, options?: any);
    addControl(control: any): void;
    on(eventName: string, handler: Function): void;
    plugin(name: string | string[], callback: Function): void;
    setFitView(overlays: any[], immediately?: boolean, avoid?: any[]): void;
    setCenter(center: any): void;
    getCenter(): any;
    getZoom(): number;
    destroy(): void;
  }

  class Marker {
    constructor(options: any);
    setMap(map: Map | null): void;
    getPosition(): any;
    setIcon(icon: Icon): void;
    on(eventName: string, handler: Function): void;
    remove(): void;
  }

  class Polyline {
    constructor(options: any);
    setMap(map: Map | null): void;
    remove(): void;
  }

  class Driving {
    constructor(options?: any);
    search(start: any, end: any, options?: any, callback?: Function): void;
    on(eventName: string, handler: Function): void;
  }

  class ToolBar {
    constructor(options?: any);
  }

  class Scale {
    constructor(options?: any);
  }

  class LngLat {
    constructor(lng: number, lat: number);
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Icon {
    constructor(options: any);
  }

  class InfoWindow {
    constructor(options: any);
    open(map: Map, position: any): void;
  }

  class Bounds {
    constructor(southWest?: any, northEast?: any);
    extend(point: any): void;
  }

  class Geocoder {
    constructor(options?: any);
    getAddress(location: any, callback: Function): void;
  }

  class DistrictSearch {
    constructor(options: any);
    search(keyword: string, callback: Function): void;
  }

  class Pixel {
    constructor(x: number, y: number);
  }

  const DrivingPolicy: {
    LEAST_TIME: number;
    LEAST_DISTANCE: number;
  };

  // 为window.AMap添加plugin静态方法
  function plugin(name: string | string[], callback: Function): void;
}

// 全局AMap对象声明
declare interface Window {
  AMap: typeof AMap;
  _AMapSecurityConfig?: {
    securityJsCode: string;
  };
} 