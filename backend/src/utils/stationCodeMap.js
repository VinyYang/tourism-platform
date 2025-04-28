/**
 * 站点代码映射工具
 * 提供汉字城市名和站点代码之间的转换功能
 */

// 主要站点的汉字名称到站点代码的映射表
const STATION_CODE_MAP = {
  '北京': 'BJP',
  '北京北': 'VAP',
  '北京南': 'VNP',
  '北京西': 'BXP',
  '北京东': 'BOP',
  '上海': 'SHH',
  '上海南': 'SNH',
  '上海虹桥': 'AOH',
  '广州': 'GZQ',
  '广州南': 'IZQ',
  '广州东': 'GGQ',
  '深圳': 'SZQ',
  '深圳北': 'IOQ',
  '成都': 'CDW',
  '成都东': 'ICW',
  '南京': 'NJH',
  '南京南': 'NKH',
  '杭州': 'HZH',
  '杭州东': 'HGH',
  '重庆': 'CQW',
  '重庆北': 'CUW',
  '西安': 'XAY',
  '西安北': 'EAY',
  '武汉': 'WHN',
  '郑州': 'ZZF',
  '郑州东': 'ZAF',
  '天津': 'TJP',
  '天津西': 'TXP',
  '长沙': 'CSQ',
  '长沙南': 'CWQ',
  '南昌': 'NCG',
  '合肥': 'HFH',
  '合肥南': 'ENH',
  '济南': 'JNK',
  '青岛': 'QDK',
  '大连': 'DLT',
  '沈阳': 'SYT',
  '哈尔滨': 'HBB',
  '太原': 'TYV',
  '昆明': 'KMM',
  '厦门': 'XMS',
  '厦门北': 'XKS',
  '南宁': 'NNZ',
  '徐州': 'XCH',
  '石家庄': 'SJP',
  '福州': 'FZS',
  '福州南': 'FYS',
  '贵阳': 'KIQ',
  '长春': 'CCT',
  '兰州': 'LZJ',
  '乌鲁木齐': 'WMR',
  // 添加更多站点映射...
};

// 反向映射：站点代码到站点名称
const CODE_TO_STATION_MAP = {};
Object.keys(STATION_CODE_MAP).forEach(stationName => {
  const code = STATION_CODE_MAP[stationName];
  CODE_TO_STATION_MAP[code] = stationName;
});

/**
 * 将站点名称转换为站点代码
 * @param {string} stationName - 站点名称（汉字）
 * @returns {string|undefined} - 站点代码或者原始输入（如未找到映射）
 */
function convertNameToCode(stationName) {
  if (!stationName) return undefined;
  
  // 如果输入的已经是3字母站点代码格式，直接返回
  if (/^[A-Za-z]{3}$/.test(stationName)) {
    return stationName.toUpperCase();
  }
  
  // 查找汉字站点名称的对应代码
  return STATION_CODE_MAP[stationName] || stationName;
}

/**
 * 将站点代码转换为站点名称
 * @param {string} stationCode - 站点代码
 * @returns {string|undefined} - 站点名称或者原始输入（如未找到映射）
 */
function convertCodeToName(stationCode) {
  if (!stationCode) return undefined;
  
  const code = stationCode.toUpperCase();
  return CODE_TO_STATION_MAP[code] || stationCode;
}

/**
 * 检查是否有效的站点代码
 * @param {string} code - 要检查的代码
 * @returns {boolean} - 是否有效
 */
function isValidStationCode(code) {
  if (!code) return false;
  
  // 检查是否符合3字母代码格式
  if (!/^[A-Za-z]{3}$/.test(code)) return false;
  
  // 简单判断为有效的3字母代码
  return true;
}

module.exports = {
  STATION_CODE_MAP,
  CODE_TO_STATION_MAP,
  convertNameToCode,
  convertCodeToName,
  isValidStationCode
}; 