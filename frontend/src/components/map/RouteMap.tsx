import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Spin, Button, message, Tag, Image } from 'antd';
import { ReloadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import styles from './RouteMap.module.less';
import AMapLoader from '@amap/amap-jsapi-loader';
import { MapSpot } from '../../@types/spot';
import { formatCoordinates } from '../../utils/coordinates';
import { sortSpotsByOrder } from '../../utils/transformers';

// 全局声明AMap
declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
  }
}

// 高德地图API配置
// const MAP_API_KEY = '66dc30adac9ce3d7d90fe5bc3cff9dba';
// const MAP_SECURITY_CODE = 'a582723c112d0fb7a36cf9c5f08a82c2';

// 定义景点类型（添加导出）
export interface Spot {
  id: number;
  name: string;
  location: [number, number] | null;
  description: string;
  order_number: number;
  imageUrl?: string;
  scenicSpot?: any; // 增加兼容性
  spot_id?: number; // 增加兼容性
}

// 标记点接口定义
interface MapMarker {
  id: string;
  position: [number, number]; // 经纬度坐标 [lng, lat]
  title?: string;
  icon?: string;
  offset?: [number, number];
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
  extData?: any;
}

// 路径接口定义
interface MapPath {
  id: string;
  path: Array<[number, number]>; // 路径点数组 [[lng1, lat1], [lng2, lat2], ...]
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeStyle?: 'solid' | 'dashed';
  lineJoin?: 'miter' | 'round' | 'bevel';
  extData?: any;
}

export interface RouteMapProps {
  center?: [number, number]; // 中心点 [经度, 纬度]
  zoom?: number;
  markers?: MapMarker[];
  paths?: MapPath[];
  onMapLoaded?: (map: any) => void;
  onMapClick?: (lnglat: [number, number]) => void;
  onMarkerClick?: (marker: any, extData: any) => void;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
  width?: number | string;
  debug?: boolean; // 调试模式
  
  // 添加兼容Itineraries.tsx和FeaturedRouteManagement.tsx的属性
  spots?: MapSpot[];
  routeName?: string;
  category?: string | null;
  difficulty?: string | null;
}

const RouteMap: React.FC<RouteMapProps> = ({
  center = [116.397428, 39.90923], // 默认北京
  zoom = 13,
  markers = [],
  paths = [],
  spots = [],
  routeName,
  category,
  difficulty,
  onMapLoaded,
  onMapClick,
  onMarkerClick,
  className,
  style,
  height = '100%',
  width = '100%',
  debug = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{[key: string]: any}>({});
  const pathsRef = useRef<{[key: string]: any}>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(window.devicePixelRatio || 1);
  const [currentInfoWindow, setCurrentInfoWindow] = useState<any | null>(null);

  // --- Effect 1: Initialize Map Instance (runs once) ---
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    const initMap = async () => {
      if (!mapContainerRef.current) {
        console.error("Map container ref is not available during init.");
        setError('地图容器未准备好');
        setLoading(false);
        return;
      }
      
      const container = mapContainerRef.current;
      // Optional: Check container dimensions again if needed
      // if (!container.clientWidth || !container.clientHeight) {
      //   console.warn('Map container dimensions are zero during init. Retrying...');
      //   setTimeout(initMap, 100); 
      //   return;
      // }

      setLoading(true);
      setError(null);

      const amapJsKey = process.env.REACT_APP_AMAP_JS_KEY;
      const amapSecurityCode = process.env.REACT_APP_AMAP_SECURITY_CODE;

      if (!amapJsKey) {
        console.error('高德地图JS密钥未在环境变量中配置 (REACT_APP_AMAP_JS_KEY)');
        setError('地图配置错误 (Key)');
        if (isMounted) setLoading(false);
        return;
      }
      if (amapSecurityCode) {
        window._AMapSecurityConfig = { securityJsCode: amapSecurityCode };
        console.log('设置高德地图安全密钥');
      } else {
        console.warn('高德地图安全密钥未在环境变量中配置 (REACT_APP_AMAP_SECURITY_CODE)');
      }

      try {
        console.log('开始加载高德地图SDK...');
        // 加载地图API
        await AMapLoader.load({
          key: amapJsKey,
          version: '2.0',
          plugins: [
            'AMap.Scale',
            'AMap.ToolBar',
            'AMap.Driving',
            'AMap.PolyEditor',
            'AMap.BezierCurve'
          ],
        });

        // Check if component is still mounted after await
        if (!isMounted || !mapContainerRef.current) return; 
        console.log('高德地图SDK加载成功');

        const mapOptions = {
          zoom,
          center: center ? new window.AMap.LngLat(center[0], center[1]) : undefined,
          resizeEnable: true,
          viewMode: '2D',
          // ... other map options
        };
        
        const map = new window.AMap.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        map.on('complete', () => {
          if (!isMounted) return; // Check again before setting state
          console.log('AMap instance initialized successfully (via complete event).');
          
          // 使用plugin方式加载控件，确保兼容高德地图2.0的API变化
          try {
            // 高德地图2.0版本控件API变更，使用正确的方式创建控件
            if (window.AMap.plugin) {
              window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], function() {
                // 加载完插件后创建控件实例
                try {
                  const scale = new window.AMap.Scale({
                    position: 'LB', // 左下角
                    offset: new window.AMap.Pixel(10, 10)
                  });
                  const toolBar = new window.AMap.ToolBar({
                    position: {
                      right: '10px',
                      bottom: '10px'
                    } as any
                  });
                  
                  map.addControl(scale);
                  map.addControl(toolBar);
                  console.log('地图控件加载成功');
                } catch (controlError) {
                  console.warn('控件加载失败，但不影响地图使用:', controlError);
                }
              });
            } else {
              console.warn('AMap.plugin 方法不可用，无法加载控件');
            }
          } catch (controlError) {
            console.warn('添加地图控件失败，但地图仍可使用:', controlError);
            // 控件加载失败不阻止地图初始化
          }
          
          setIsMapReady(true); // Set map ready state
          setLoading(false);
          if (onMapLoaded) onMapLoaded(map);
        });

        map.on('error', (err: any) => {
          console.error('AMap map instance error:', err);
          if (isMounted) {
              setError('地图实例加载错误。');
              setLoading(false);
          }
        });
        
        // Add map click listener if needed (moved from complete event)
        if (onMapClick && typeof map.on === 'function') {
            map.on('click', (e: any) => {
               if (e && e.lnglat) {
                   onMapClick([e.lnglat.getLng(), e.lnglat.getLat()]);
               } else {
                   console.warn('Map click event missing lnglat data.');
               }
            });
        }

      } catch (loadError: any) {
        console.error('Failed to load AMap script or init map:', loadError);
        if (isMounted) {
            setError(`地图脚本加载失败: ${loadError.message}`);
            setLoading(false);
        }
      }
    };

    initMap();

    // Cleanup function
    return () => {
      isMounted = false; // Mark as unmounted
      if (mapInstanceRef.current && typeof mapInstanceRef.current.destroy === 'function') {
        try {
           console.log("Destroying map instance on unmount or re-init");
           mapInstanceRef.current.destroy();
        } catch(e) {
            console.error("Error destroying map instance on unmount:", e);
        }
        mapInstanceRef.current = null;
        setIsMapReady(false); // Reset map ready state
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Effect 2: Update Markers --- 
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.AMap) return;
    const map = mapInstanceRef.current;
    const AMap = window.AMap;
    
    const newMarkersMap: {[key: string]: any} = {};

    // Add/Update markers based on `markers` prop
    markers.forEach(markerData => {
        const existingMarker = markersRef.current[markerData.id];
        if (existingMarker) {
             if (typeof existingMarker.setPosition === 'function') {
                 existingMarker.setPosition(new AMap.LngLat(markerData.position[0], markerData.position[1]));
             }
            // Optionally update other properties like icon, title etc. if needed
            newMarkersMap[markerData.id] = existingMarker;
        } else {
            try {
                // 创建自定义内容
                const markerContent = document.createElement('div');
                markerContent.className = styles.customMarker;

                // 添加序号到标记点
                const orderNumber = markerData.extData?.order_number || '';
                markerContent.innerHTML = `
                    <div class="${styles.markerIcon}">
                        <div class="${styles.markerLabel}">${orderNumber}</div>
                    </div>
                `;
                
                const marker = new AMap.Marker({
                    map: map,
                    position: new AMap.LngLat(markerData.position[0], markerData.position[1]),
                    title: markerData.title,
                    extData: markerData.extData,
                    content: markerContent,
                    offset: new AMap.Pixel(-16, -16), // 调整偏移量使标记点位置更准确
                    zIndex: orderNumber ? 100 + parseInt(orderNumber, 10) : 100, // 按序号排序z轴层级
                    animation: 'AMAP_ANIMATION_DROP' // 添加掉落动画效果
                });
                
                // 创建信息窗口实例
                const infoWindow = new AMap.InfoWindow({
                    isCustom: true,
                    content: createInfoWindowContent(markerData.extData),
                    anchor: 'bottom-center',
                    offset: new AMap.Pixel(0, -10),
                    autoMove: true,
                    closeWhenClickMap: true,
                    retainWhenClose: true // 关闭时保留DOM结构，提高性能
                });
                
                // 创建悬停事件防抖函数
                const showInfoWindow = debounce(() => {
                    // 关闭当前打开的信息窗口
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                    }
                    // 打开新的信息窗口
                    infoWindow.open(map, marker.getPosition());
                    setCurrentInfoWindow(infoWindow);
                }, 100);
                
                // 添加鼠标悬停事件
                marker.on('mouseover', function() {
                    showInfoWindow();
                });
                
                marker.on('mouseout', function() {
                    // 延迟关闭窗口
                    setTimeout(() => {
                        if (infoWindow && !infoWindow._isHovered) {
                            infoWindow.close();
                        }
                    }, 300);
                });
                
                // 给信息窗口添加鼠标事件
                if (infoWindow.getContentDom) {
                    const infoWindowDom = infoWindow.getContentDom();
                    if (infoWindowDom) {
                        infoWindowDom.addEventListener('mouseover', function() {
                            infoWindow._isHovered = true;
                        });
                        infoWindowDom.addEventListener('mouseout', function() {
                            infoWindow._isHovered = false;
                            setTimeout(() => infoWindow.close(), 300);
                        });
                    }
                }
                
                if (onMarkerClick && typeof marker.on === 'function') {
                    marker.on('click', () => {
                        // 显示详细信息窗口
                        infoWindow.open(map, marker.getPosition());
                        setCurrentInfoWindow(infoWindow);
                        onMarkerClick(marker, markerData.extData);
                    });
                }
                
                newMarkersMap[markerData.id] = marker;
            } catch (err) {
                 console.error(`创建标记 ${markerData.id} 失败:`, err);
            }
        }
    });

    // Remove old markers not in the new list
    Object.keys(markersRef.current).forEach(markerId => {
      if (!newMarkersMap[markerId] && markersRef.current[markerId]) {
        if (typeof markersRef.current[markerId].setMap === 'function') {
          markersRef.current[markerId].setMap(null);
        }
      }
    });

    markersRef.current = newMarkersMap;

  }, [isMapReady, markers, onMarkerClick]); // Depend on map readiness and markers prop

  // --- Effect 3: Update Paths ---
  useEffect(() => {
      if (!isMapReady || !mapInstanceRef.current || !window.AMap) return;
      const map = mapInstanceRef.current;
      const AMap = window.AMap;

      const newPathsMap: {[key: string]: any} = {};

      // Add/Update paths based on `paths` prop
      paths.forEach(pathData => {
          const existingPath = pathsRef.current[pathData.id];
          if (existingPath) {
              if (typeof existingPath.setPath === 'function') {
                  existingPath.setPath(pathData.path.map(p => new AMap.LngLat(p[0], p[1])));
              }
              // Optionally update styles if needed
              newPathsMap[pathData.id] = existingPath;
          } else {
              try {
                  const polyline = new AMap.Polyline({ map: map, path: pathData.path.map(p => new AMap.LngLat(p[0], p[1])), strokeColor: pathData.strokeColor || '#0066FF', strokeWeight: pathData.strokeWeight || 5 });
                  newPathsMap[pathData.id] = polyline;
              } catch (err) { console.error(`创建路径 ${pathData.id} 失败:`, err); }
          }
      });

      // Remove old paths not in the new list
      Object.keys(pathsRef.current).forEach(pathId => {
        if (!newPathsMap[pathId] && pathsRef.current[pathId]) {
          if (typeof pathsRef.current[pathId].setMap === 'function') {
            pathsRef.current[pathId].setMap(null);
          }
        }
      });
      pathsRef.current = newPathsMap;
      
  }, [isMapReady, paths]); // Depend on map readiness and paths prop

  // --- Effect 4: Update Markers and Paths from Spots --- 
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.AMap) return;
    const map = mapInstanceRef.current;
    const AMap = window.AMap;
    
    console.log(`开始处理${spots.length}个景点数据，绘制路线和标记`);
    
    try {
      // 清理现有标记和路线
      Object.values(markersRef.current).forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      Object.values(pathsRef.current).forEach(path => {
        if (path && typeof path.setMap === 'function') {
          path.setMap(null);
        }
      });
      markersRef.current = {};
      pathsRef.current = {};

      // 筛选有效景点
      const validSpots = spots.filter(spot => spot.location !== null);
      
      if (validSpots.length === 0) {
        console.warn('没有找到有效的景点位置数据');
        return;
      }
      
      console.log(`找到${validSpots.length}个有效景点位置`);
      
      // 按order_number排序景点
      const orderedSpots = sortSpotsByOrder(validSpots);
      
      // 创建标记
      orderedSpots.forEach((spot, index) => {
        if (!spot.location) return;

        // 创建标记内容
        const markerContent = document.createElement('div');
        markerContent.className = 'custom-marker';
        markerContent.innerHTML = `
          <div class="marker-icon">
            <div class="marker-label">${spot.order_number || index + 1}</div>
          </div>
        `;

        // 创建标记
        const marker = new AMap.Marker({
          map: map,
          position: new AMap.LngLat(spot.location[0], spot.location[1]),
          title: spot.name,
          content: markerContent
        });

        // 创建信息窗口
        const infoWindow = new AMap.InfoWindow({
          content: `
            <div class="info-window">
              <h4>${spot.name}</h4>
              <p>序号: ${spot.order_number || index + 1}</p>
              <p>坐标: ${formatCoordinates(spot.location)}</p>
              ${spot.description ? `<div class="spot-description">${spot.description}</div>` : ''}
              ${spot.imageUrl ? `<img src="${spot.imageUrl}" alt="${spot.name}" style="max-width:200px;margin-top:8px;">` : ''}
            </div>
          `,
          offset: new AMap.Pixel(0, -30)
        });

        // 添加点击事件
        marker.on('click', () => {
          if (currentInfoWindow) {
            currentInfoWindow.close();
          }
          infoWindow.open(map, marker.getPosition());
          setCurrentInfoWindow(infoWindow);
          
          if (onMarkerClick) {
            onMarkerClick(marker, spot);
          }
        });

        markersRef.current[`spot-${spot.id}`] = marker;
      });

      // 创建路线
      if (orderedSpots.length > 1) {
        const path = orderedSpots
          .filter(spot => spot.location)
          .map(spot => spot.location as [number, number]);

        if (path.length > 1) {
          // 新增：优先用高德驾车路径规划
          try {
            const driving = new window.AMap.Driving({
              map: map,
              hideMarkers: true
            });
            driving.search(
              path[0],
              path[path.length - 1],
              { waypoints: path.slice(1, -1) },
              (status: string, result: any) => {
                if (status === 'complete' && result.routes && result.routes.length > 0) {
                  // 清除旧路线
                  if (pathsRef.current['main-route']) {
                    pathsRef.current['main-route'].setMap(null);
                  }
                  // 合并所有step.path为完整路径
                  const fullPath = result.routes[0].steps.flatMap((step: any) => step.path);
                  const drivingPolyline = new window.AMap.Polyline({
                    path: fullPath,
                    strokeColor: "#3366FF",
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                    lineJoin: 'round',
                    lineCap: 'round',
                    showDir: true
                  });
                  drivingPolyline.setMap(map);
                  pathsRef.current['main-route'] = drivingPolyline;
                  // 调整视野
                  map.setFitView([drivingPolyline]);
                } else {
                  // 失败降级为直线
                  if (pathsRef.current['main-route']) {
                    pathsRef.current['main-route'].setMap(null);
                  }
                  const polyline = new window.AMap.Polyline({
                    path: path,
                    strokeColor: "#3366FF",
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                    lineJoin: 'round',
                    lineCap: 'round',
                    showDir: true
                  });
                  polyline.setMap(map);
                  pathsRef.current['main-route'] = polyline;
                  map.setFitView([polyline]);
                }
              }
            );
          } catch (err) {
            // 兜底：API异常时也降级为直线
            if (pathsRef.current['main-route']) {
              pathsRef.current['main-route'].setMap(null);
            }
            const polyline = new window.AMap.Polyline({
              path: path,
              strokeColor: "#3366FF",
              strokeWeight: 6,
              strokeOpacity: 0.8,
              lineJoin: 'round',
              lineCap: 'round',
              showDir: true
            });
            polyline.setMap(map);
            pathsRef.current['main-route'] = polyline;
            map.setFitView([polyline]);
          }
        }
      }

      // 调整地图视野
      setTimeout(() => {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.setFitView === 'function') {
          const overlays = [...Object.values(markersRef.current), ...Object.values(pathsRef.current)];
          mapInstanceRef.current.setFitView(overlays, false, [60, 60, 60, 60]);
        }
      }, 100);

    } catch (error) {
      console.error('处理景点数据时出错:', error);
      setError('处理景点数据时出错，请刷新页面重试');
    }
  }, [isMapReady, spots, currentInfoWindow, onMarkerClick]);

  // --- Effect 5: Update Center and Zoom --- 
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current && center && zoom) {
        // Avoid calling setZoomAndCenter if map is already at the target
        const currentCenter = mapInstanceRef.current.getCenter();
        const currentZoom = mapInstanceRef.current.getZoom();
        const targetLngLat = new window.AMap.LngLat(center[0], center[1]);
        
        if (currentZoom !== zoom || !currentCenter.equals(targetLngLat)) {
             if (typeof mapInstanceRef.current.setZoomAndCenter === 'function') {
                try {
                   console.log(`Setting map zoom to ${zoom} and center to ${center}`);
                   mapInstanceRef.current.setZoomAndCenter(zoom, targetLngLat);
                } catch(setZoomError) {
                    console.error("Error setting zoom and center:", setZoomError);
                }
            } else {
                console.warn("setZoomAndCenter method not available on map instance.");
            }
        }
    }
  }, [isMapReady, center, zoom]); // Depend on map readiness, center, and zoom props

  // --- Effect 6: Handle Resize ---
  useEffect(() => {
    const resizeHandler = () => {
      if (mapInstanceRef.current && mapContainerRef.current && typeof mapInstanceRef.current.resize === 'function') {
        const newPixelRatio = window.devicePixelRatio || 1;
        if (newPixelRatio !== devicePixelRatio) {
          setDevicePixelRatio(newPixelRatio);
        }
        try {
           mapInstanceRef.current.resize();
        } catch(resizeError) {
           console.error("Error resizing map:", resizeError);
        }
      }
    };
    
    const debouncedResizeHandler = debounce(resizeHandler, 150);
    window.addEventListener('resize', debouncedResizeHandler);
    return () => window.removeEventListener('resize', debouncedResizeHandler);
  }, [devicePixelRatio]);

  // 重新加载地图
  const handleRetry = () => {
    message.success('正在重新加载地图...');
    setLoading(true);
    setError(null);
    setIsMapReady(false);
    
    // 销毁当前地图实例
    if (mapInstanceRef.current && typeof mapInstanceRef.current.destroy === 'function') {
      try {
        mapInstanceRef.current.destroy();
        console.log('已销毁旧地图实例');
      } catch(e) {
        console.error('销毁地图实例失败:', e);
      }
      mapInstanceRef.current = null;
    }
    
    // 清空标记和路径引用
    markersRef.current = {};
    pathsRef.current = {};
    
    // 重新初始化地图
    const amapJsKey = process.env.REACT_APP_AMAP_JS_KEY;
    const amapSecurityCode = process.env.REACT_APP_AMAP_SECURITY_CODE;

    if (!amapJsKey) {
      console.error('高德地图JS密钥未在环境变量中配置 (REACT_APP_AMAP_JS_KEY)');
      setError('地图配置错误 (Key)');
      setLoading(false);
      return;
    }
    
    if (amapSecurityCode) {
      window._AMapSecurityConfig = { securityJsCode: amapSecurityCode };
      console.log('设置高德地图安全密钥');
    }
    
    const initMap = async () => {
      if (!mapContainerRef.current) {
        console.error("地图容器引用不可用");
        setError('地图容器未准备好');
        setLoading(false);
        return;
      }
      
      try {
        console.log('开始重新加载高德地图SDK...');
        // 重新加载地图API
        await AMapLoader.load({
          key: amapJsKey,
          version: '2.0',
          plugins: [
            'AMap.Scale',
            'AMap.ToolBar',
            'AMap.Driving',
            'AMap.PolyEditor',
            'AMap.BezierCurve'
          ],
        });

        console.log('高德地图SDK重新加载成功');

        const mapOptions = {
          zoom,
          center: center ? new window.AMap.LngLat(center[0], center[1]) : undefined,
          resizeEnable: true,
          viewMode: '2D',
        };
        
        const map = new window.AMap.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        // 设置完成回调
        map.on('complete', () => {
          console.log('地图实例初始化成功');
          
          // 添加控件
          try {
            if (window.AMap.plugin) {
              window.AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], function() {
                try {
                  const scale = new window.AMap.Scale({
                    position: 'LB',
                    offset: new window.AMap.Pixel(10, 10)
                  });
                  const toolBar = new window.AMap.ToolBar({
                    position: {
                      right: '10px',
                      bottom: '10px'
                    } as any
                  });
                  
                  map.addControl(scale);
                  map.addControl(toolBar);
                  console.log('地图控件加载成功');
                } catch (controlError) {
                  console.warn('控件加载失败:', controlError);
                }
              });
            }
          } catch (controlError) {
            console.warn('添加地图控件失败:', controlError);
          }
          
          // 添加点击事件
          if (onMapClick && typeof map.on === 'function') {
            map.on('click', (e: any) => {
              if (e && e.lnglat) {
                onMapClick([e.lnglat.getLng(), e.lnglat.getLat()]);
              }
            });
          }
          
          setIsMapReady(true);
          setLoading(false);
          if (onMapLoaded) onMapLoaded(map);
        });

        // 添加错误处理
        map.on('error', (err: any) => {
          console.error('地图实例错误:', err);
          setError('地图加载错误，请重试');
          setLoading(false);
        });

      } catch (loadError: any) {
        console.error('加载高德地图失败:', loadError);
        setError(`地图加载失败: ${loadError.message || '未知错误'}`);
        setLoading(false);
      }
    };

    // 执行初始化
    initMap();
  };
  
  // 渲染错误状态界面
  const renderErrorState = () => (
    <div className={styles.errorOverlay}>
      <p>{error}</p>
      <Button 
        type="primary" 
        icon={<ReloadOutlined />} 
        onClick={handleRetry}
      >
        重新加载地图
      </Button>
    </div>
  );

  // 合并样式
  const containerStyle: React.CSSProperties = {
    position: 'relative', // 确保子元素定位正确
    ...style,
    height,
    width,
    overflow: 'hidden', // 隐藏可能溢出的内容
  };
  
  // 如果路由名称可用，在地图上方显示
  const showRouteInfo = routeName || category || difficulty;

  // 添加一个更新地图路径的辅助函数
  const updateMapPaths = (paths: MapPath[]) => {
    if (!mapInstanceRef.current || !window.AMap) return;
    
    const map = mapInstanceRef.current;
    const AMap = window.AMap;
    
    // 获取当前活动的路径
    const activePathsToUpdate = paths.filter((p: MapPath) => !p.id.includes('temp'));
    
    // 更新路径
    const newPathsMapUpdate: {[key: string]: any} = { ...pathsRef.current };
    
    // 清除临时路径
    Object.keys(newPathsMapUpdate).forEach(pathId => {
        if (pathId.includes('temp')) {
            if (newPathsMapUpdate[pathId]?.setMap) {
                newPathsMapUpdate[pathId].setMap(null);
            }
            delete newPathsMapUpdate[pathId];
        }
    });
    
    // 添加/更新路径
    activePathsToUpdate.forEach((pathData: MapPath) => {
        try {
            const existingPath = newPathsMapUpdate[pathData.id];
            if (existingPath) {
                if (typeof existingPath.setPath === 'function') {
                    existingPath.setPath(pathData.path.map((p: [number, number]) => new AMap.LngLat(p[0], p[1])));
                }
            } else {
                const polyline = new AMap.Polyline({ 
                    map: map, 
                    path: pathData.path.map((p: [number, number]) => new AMap.LngLat(p[0], p[1])), 
                    strokeColor: pathData.strokeColor || '#0066FF', 
                    strokeWeight: pathData.strokeWeight || 5,
                    strokeOpacity: pathData.strokeOpacity || 0.8,
                    strokeStyle: pathData.strokeStyle || 'solid',
                    lineJoin: pathData.lineJoin || 'round',
                    showDir: true // 显示方向
                });
                newPathsMapUpdate[pathData.id] = polyline;
            }
        } catch (err) { 
            console.error(`更新路径失败:`, err); 
        }
    });
    
    // 更新引用
    pathsRef.current = newPathsMapUpdate;
    
    // 调整地图视图
    setTimeout(() => {
        if (mapInstanceRef.current && typeof mapInstanceRef.current.setFitView === 'function') {
            try {
                // 获取所有覆盖物以调整视图
                const overlays = [...Object.values(markersRef.current), ...Object.values(pathsRef.current)];
                if (overlays.length > 0) {
                    mapInstanceRef.current.setFitView(overlays, false, [60, 60, 60, 60]);
                    console.log("更新路径后调整地图视图");
                }
            } catch(fitViewError) {
                console.error("调整地图视图失败:", fitViewError);
            }
        }
    }, 200);
  };

  // 添加一个创建信息窗口内容的辅助函数
  const createInfoWindowContent = (spot: any): HTMLElement => {
    // 创建信息窗口的内容
    const content = document.createElement('div');
    content.className = styles.infoWindow;
    
    // 关闭按钮 - 用于视觉效果，实际通过AMap关闭
    const closeBtn = document.createElement('div');
    closeBtn.className = styles.closeButton;
    content.appendChild(closeBtn);
    
    // 景点名称和序号
    const titleDiv = document.createElement('div');
    titleDiv.className = styles.infoTitle;
    titleDiv.innerHTML = `
        <span>${spot?.name || '未命名景点'}</span>
        ${spot?.order_number ? `<span class="${styles.orderBadge}">${spot.order_number}</span>` : ''}
    `;
    content.appendChild(titleDiv);
    
    // 景点描述（如果有）
    if (spot?.description) {
        const descDiv = document.createElement('div');
        descDiv.className = styles.infoDesc;
        // 截断过长的描述
        const shortDesc = spot.description.length > 100 ? 
            spot.description.substring(0, 100) + '...' : 
            spot.description;
        descDiv.textContent = shortDesc;
        content.appendChild(descDiv);
    }
    
    // 景点图片（如果有）
    if (spot?.imageUrl) {
        const imgDiv = document.createElement('div');
        imgDiv.className = styles.infoImage;
        // 使用createElement替代new Image()
        const img = document.createElement('img');
        img.src = spot.imageUrl;
        img.alt = spot?.name || '景点图片';
        img.onerror = () => {
            imgDiv.style.display = 'none'; // 图片加载失败时隐藏图片容器
        };
        imgDiv.appendChild(img);
        content.appendChild(imgDiv);
    }
    
    // 底部区域
    const footerDiv = document.createElement('div');
    footerDiv.className = styles.infoFooter;
    footerDiv.innerHTML = `
        <span style="font-size: 12px; color: #999;">点击查看详情</span>
    `;
    content.appendChild(footerDiv);
    
    return content;
  };

  return (
    <div className={`${styles.routeMapContainer} ${className || ''}`} style={containerStyle}>
      {/* 加载状态 */} 
      {loading && (
        <div className={styles.loadingOverlay}>
          <Spin size="large" tip="地图加载中..." />
        </div>
      )}
      
      {/* 错误状态 */} 
      {error && renderErrorState()}
      
      {/* 地图容器 - 仍然保持渲染，但在错误时隐藏 */} 
      <div 
        ref={mapContainerRef} 
        className={styles.mapElement} 
        style={{ 
          height: '100%', 
          width: '100%', 
          visibility: error ? 'hidden' : 'visible' 
        }}
      ></div>
      
      {/* 路线信息（可选）*/} 
      {showRouteInfo && isMapReady && !error && (
        <div className={styles.routeInfoOverlay}>
          {routeName && <h4>{routeName}</h4>}
          <div className={styles.routeTags}>
            {category && <Tag color="blue">{category}</Tag>}
            {difficulty && <Tag color={getDifficultyColor(difficulty)}>{getDifficultyText(difficulty)}</Tag>}
          </div>
        </div>
      )}
      
      {/* 调试信息 */} 
      {debug && (
        <pre className={styles.debugInfo}>
          {JSON.stringify({
            loading,
            error,
            isMapReady,
            center,
            zoom,
            markerCount: Object.keys(markersRef.current).length,
            pathCount: Object.keys(pathsRef.current).length,
            spotCount: spots.length
          }, null, 2)}
        </pre>
      )}
    </div>
  );
};

// 辅助函数：获取难度颜色和文本 (从 Itineraries 复制或共享)
const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
        case 'easy': return '#52c41a';
        case 'medium': return '#faad14';
        case 'hard': return '#f5222d';
        default: return '#52c41a';
    }
};

const getDifficultyText = (difficulty: string): string => {
    switch (difficulty) {
        case 'easy': return '轻松';
        case 'medium': return '中等';
        case 'hard': return '困难';
        default: return '轻松';
    }
};

// 防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: NodeJS.Timeout | null = null;
  return function(...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

export default RouteMap;