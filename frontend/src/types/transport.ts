/**
 * 交通类型相关接口定义
 */

// 火车线路信息接口
export interface TrainLineInfo {
  train_code: string;      // 车次编号
  from_station: string;    // 出发站
  to_station: string;      // 到达站
  start_time: string;      // 出发时间
  arrive_time: string;     // 到达时间
  duration: string;        // 行程时间
  price: number;           // 价格
  distance: number;        // 距离
  seats_available: number; // 可用座位数
  date: string;            // 日期
}

// 航班信息接口
export interface FlightInfo {
  flightNo: string;      // 航班号
  airline: string;       // 航空公司
  departure: string;     // 出发城市
  arrival: string;       // 到达城市
  departureTime: string; // 出发时间
  arrivalTime: string;   // 到达时间
  duration: string;      // 飞行时间
  price: number;         // 价格
  stops: number;         // 经停次数
  date: string;          // 日期
}

// 大巴线路信息接口
export interface BusLineInfo {
  busNo: string;        // 大巴编号
  fromStation: string;  // 出发站
  toStation: string;    // 到达站
  departureTime: string; // 出发时间
  arrivalTime: string;  // 到达时间
  duration: string;     // 行程时间
  price: number;        // 价格
  busType: string;      // 大巴类型
  date: string;         // 日期
}

// 交通路线数据接口
export interface TransportRouteData {
  type: string;          // 交通类型
  from: string;          // 出发地
  to: string;            // 目的地
  date: string;          // 日期
  price: number;         // 价格
  duration: string;      // 行程时间
  distance?: number;     // 距离
  details: TrainLineInfo | FlightInfo | BusLineInfo; // 具体交通信息
}

// 交通路线可视化接口
export interface RouteVisualization {
  id: string;            // 路线ID
  type: string;          // 交通类型
  path: Array<[number, number]>; // 路线路径点
  color: string;         // 路线颜色
  width: number;         // 路线宽度
  name: string;          // 路线名称
} 