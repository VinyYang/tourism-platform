/**
 * 火车站信息结构
 */
export interface StationInfo {
  name: string;     // 站点中文名称
  code: string;     // 站点代码
  pinyin: string;   // 拼音全称
  pyabbr?: string;  // 拼音首字母缩写
  city?: string;    // 所属城市
  isHot?: boolean;  // 是否热门站点
}

/**
 * 全国主要火车站数据
 * 包含站名、代码和拼音信息
 */
export const STATION_DATA: StationInfo[] = [
  { name: '北京', code: 'BJP', pinyin: 'beijing', pyabbr: 'bj', isHot: true },
  { name: '北京北', code: 'VAP', pinyin: 'beijingbei', pyabbr: 'bjb' },
  { name: '北京南', code: 'VNP', pinyin: 'beijingnan', pyabbr: 'bjn', isHot: true },
  { name: '北京西', code: 'BXP', pinyin: 'beijingxi', pyabbr: 'bjx', isHot: true },
  { name: '北京东', code: 'BOP', pinyin: 'beijingdong', pyabbr: 'bjd' },
  { name: '上海', code: 'SHH', pinyin: 'shanghai', pyabbr: 'sh', isHot: true },
  { name: '上海南', code: 'SNH', pinyin: 'shanghainan', pyabbr: 'shn', isHot: true },
  { name: '上海虹桥', code: 'AOH', pinyin: 'shanghaihongqiao', pyabbr: 'shhq', isHot: true },
  { name: '广州', code: 'GZQ', pinyin: 'guangzhou', pyabbr: 'gz', isHot: true },
  { name: '广州南', code: 'IZQ', pinyin: 'guangzhounan', pyabbr: 'gzn', isHot: true },
  { name: '广州东', code: 'GGQ', pinyin: 'guangzhoudong', pyabbr: 'gzd', isHot: true },
  { name: '深圳', code: 'SZQ', pinyin: 'shenzhen', pyabbr: 'sz', isHot: true },
  { name: '深圳北', code: 'IOQ', pinyin: 'shenzhenbei', pyabbr: 'szb', isHot: true },
  { name: '成都', code: 'CDW', pinyin: 'chengdu', pyabbr: 'cd', isHot: true },
  { name: '成都东', code: 'ICW', pinyin: 'chengdudong', pyabbr: 'cdd', isHot: true },
  { name: '南京', code: 'NJH', pinyin: 'nanjing', pyabbr: 'nj', isHot: true },
  { name: '南京南', code: 'NKH', pinyin: 'nanjingnan', pyabbr: 'njn', isHot: true },
  { name: '杭州', code: 'HZH', pinyin: 'hangzhou', pyabbr: 'hz', isHot: true },
  { name: '杭州东', code: 'HGH', pinyin: 'hangzhoudong', pyabbr: 'hzd', isHot: true },
  { name: '重庆', code: 'CQW', pinyin: 'chongqing', pyabbr: 'cq', isHot: true },
  { name: '重庆北', code: 'CUW', pinyin: 'chongqingbei', pyabbr: 'cqb', isHot: true },
  { name: '西安', code: 'XAY', pinyin: 'xian', pyabbr: 'xa', isHot: true },
  { name: '西安北', code: 'EAY', pinyin: 'xianbei', pyabbr: 'xab', isHot: true },
  { name: '武汉', code: 'WHN', pinyin: 'wuhan', pyabbr: 'wh', isHot: true },
  { name: '郑州', code: 'ZZF', pinyin: 'zhengzhou', pyabbr: 'zz', isHot: true },
  { name: '郑州东', code: 'ZAF', pinyin: 'zhengzhoudong', pyabbr: 'zzd', isHot: true },
  { name: '天津', code: 'TJP', pinyin: 'tianjin', pyabbr: 'tj', isHot: true },
  { name: '天津西', code: 'TXP', pinyin: 'tianjinxi', pyabbr: 'tjx', isHot: true },
  { name: '长沙', code: 'CSQ', pinyin: 'changsha', pyabbr: 'cs', isHot: true },
  { name: '长沙南', code: 'CWQ', pinyin: 'changshanan', pyabbr: 'csn', isHot: true },
  { name: '南昌', code: 'NCG', pinyin: 'nanchang', pyabbr: 'nc', isHot: true },
  { name: '合肥', code: 'HFH', pinyin: 'hefei', pyabbr: 'hf', isHot: true },
  { name: '合肥南', code: 'ENH', pinyin: 'hefeinan', pyabbr: 'hfn', isHot: true },
  { name: '济南', code: 'JNK', pinyin: 'jinan', pyabbr: 'jn', isHot: true },
  { name: '青岛', code: 'QDK', pinyin: 'qingdao', pyabbr: 'qd', isHot: true },
  { name: '大连', code: 'DLT', pinyin: 'dalian', pyabbr: 'dl', isHot: true },
  { name: '沈阳', code: 'SYT', pinyin: 'shenyang', pyabbr: 'sy', isHot: true },
  { name: '哈尔滨', code: 'HBB', pinyin: 'haerbin', pyabbr: 'heb', isHot: true },
  { name: '太原', code: 'TYV', pinyin: 'taiyuan', pyabbr: 'ty', isHot: true },
  { name: '昆明', code: 'KMM', pinyin: 'kunming', pyabbr: 'km', isHot: true },
  { name: '厦门', code: 'XMS', pinyin: 'xiamen', pyabbr: 'xm', isHot: true },
  { name: '厦门北', code: 'XKS', pinyin: 'xiamenbei', pyabbr: 'xmb', isHot: true },
  { name: '南宁', code: 'NNZ', pinyin: 'nanning', pyabbr: 'nn', isHot: true },
  { name: '徐州', code: 'XCH', pinyin: 'xuzhou', pyabbr: 'xz', isHot: true },
  { name: '石家庄', code: 'SJP', pinyin: 'shijiazhuang', pyabbr: 'sjz', isHot: true },
  { name: '福州', code: 'FZS', pinyin: 'fuzhou', pyabbr: 'fz', isHot: true },
  { name: '福州南', code: 'FYS', pinyin: 'fuzhounan', pyabbr: 'fzn', isHot: true },
  { name: '贵阳', code: 'KIQ', pinyin: 'guiyang', pyabbr: 'gy', isHot: true },
  { name: '长春', code: 'CCT', pinyin: 'changchun', pyabbr: 'cc', isHot: true },
  { name: '兰州', code: 'LZJ', pinyin: 'lanzhou', pyabbr: 'lz', isHot: true },
  { name: '乌鲁木齐', code: 'WMR', pinyin: 'wulumuqi', pyabbr: 'wlmq', isHot: true }
];

/**
 * 通过站点名称查找站点代码
 * @param stationName 站点名称（汉字）
 * @returns 站点代码或undefined（如果未找到）
 */
export function getStationCodeByName(stationName: string): string | undefined {
  if (!stationName) return undefined;
  
  // 去除空格并转换为小写（用于拼音匹配）
  const trimmedName = stationName.trim().toLowerCase();
  
  // 尝试直接匹配站点名称（汉字精确匹配）
  const exactMatch = STATION_DATA.find(s => s.name === stationName);
  if (exactMatch) return exactMatch.code;
  
  // 尝试拼音全拼匹配
  const pinyinMatch = STATION_DATA.find(s => s.pinyin === trimmedName);
  if (pinyinMatch) return pinyinMatch.code;
  
  // 尝试拼音首字母匹配
  const abbrMatch = STATION_DATA.find(s => s.pyabbr === trimmedName);
  if (abbrMatch) return abbrMatch.code;
  
  // 尝试模糊匹配（汉字部分匹配）
  // 例如输入"北京"可能匹配到"北京"、"北京南"、"北京西"等
  const fuzzyMatch = STATION_DATA.find(s => 
    s.name.includes(stationName) || 
    (stationName.length > 1 && s.name.startsWith(stationName))
  );
  
  return fuzzyMatch?.code;
}

/**
 * 通过站点代码查找站点名称
 * @param stationCode 站点代码
 * @returns 站点名称或undefined（如果未找到）
 */
export function getStationNameByCode(stationCode: string): string | undefined {
  if (!stationCode) return undefined;
  
  const station = STATION_DATA.find(s => s.code.toUpperCase() === stationCode.toUpperCase());
  return station?.name;
}

/**
 * 搜索站点信息（支持汉字名称、拼音、站点代码）
 * @param keyword 搜索关键词
 * @returns 匹配的站点列表
 */
export function searchStations(keyword: string): StationInfo[] {
  if (!keyword || keyword.length < 1) {
    // 当无输入时，返回热门站点
    return STATION_DATA.filter(s => s.isHot);
  }
  
  const trimmedKeyword = keyword.trim().toLowerCase();
  
  return STATION_DATA.filter(station => 
    station.name.includes(keyword) || 
    station.pinyin.includes(trimmedKeyword) ||
    (station.pyabbr && station.pyabbr.includes(trimmedKeyword)) ||
    station.code.toLowerCase().includes(trimmedKeyword)
  );
}

/**
 * 获取热门站点列表
 * @returns 热门站点数组
 */
export function getHotStations(): StationInfo[] {
  return STATION_DATA.filter(station => station.isHot);
}

export default {
  STATION_DATA,
  getStationCodeByName,
  getStationNameByCode,
  searchStations,
  getHotStations
}; 