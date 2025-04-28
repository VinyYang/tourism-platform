  // 添加标记和路线
  const addMarkersAndRoute = (map: any, spots: Spot[]) => {
    const validSpots = spots.filter(spot => spot.location && Array.isArray(spot.location) && spot.location.length === 2);
    
    if (validSpots.length === 0) {
      setError('没有有效的景点坐标信息');
      setLoading(false);
      return;
    }

    // 添加景点标记
    const markers: any[] = [];
    // 修复Bounds类型错误
    const bounds = new window.AMap.Bounds() as any;

    validSpots.forEach((spot, index) => {
      if (!spot.location) return;
      
      const position = new window.AMap.LngLat(spot.location[0], spot.location[1]);
      bounds.extend(position);

      // 创建标记
      const marker = new window.AMap.Marker({
        position,
        title: spot.name,
        label: {
          content: `<div class="amap-marker-label">${index + 1}. ${spot.name}</div>`,
          direction: 'top'
        }
      });

      // ... 其他代码保持不变
    });
  } 