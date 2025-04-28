// 删除以下重复的声明，已在amap.d.ts文件中统一声明
// declare global {
//     interface Window {
//         AMap: any;
//     }
// }

// 修复driving.search方法中的位置参数处理
driving.search(
    startSpot.location ? new window.AMap.LngLat(startSpot.location[0], startSpot.location[1]) : null, 
    endSpot.location ? new window.AMap.LngLat(endSpot.location[0], endSpot.location[1]) : null, 
    (status: string, result: any) => {
        // 其他代码不变
    }
); 