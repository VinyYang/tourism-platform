import {
  isValidCoordinate,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  extractCoordinates,
  formatCoordinates,
  parseCoordinatesString
} from '../coordinates';

describe('坐标验证函数', () => {
  describe('isValidCoordinate', () => {
    it('应该验证有效的数字', () => {
      expect(isValidCoordinate(0)).toBe(true);
      expect(isValidCoordinate(123.456)).toBe(true);
      expect(isValidCoordinate(-123.456)).toBe(true);
    });

    it('应该拒绝无效的输入', () => {
      expect(isValidCoordinate(NaN)).toBe(false);
      expect(isValidCoordinate(Infinity)).toBe(false);
      expect(isValidCoordinate(-Infinity)).toBe(false);
    });
  });

  describe('isValidLatitude', () => {
    it('应该验证有效的纬度', () => {
      expect(isValidLatitude(0)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
      expect(isValidLatitude(45.123)).toBe(true);
    });

    it('应该拒绝无效的纬度', () => {
      expect(isValidLatitude(90.1)).toBe(false);
      expect(isValidLatitude(-90.1)).toBe(false);
      expect(isValidLatitude(NaN)).toBe(false);
    });
  });

  describe('isValidLongitude', () => {
    it('应该验证有效的经度', () => {
      expect(isValidLongitude(0)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
      expect(isValidLongitude(123.456)).toBe(true);
    });

    it('应该拒绝无效的经度', () => {
      expect(isValidLongitude(180.1)).toBe(false);
      expect(isValidLongitude(-180.1)).toBe(false);
      expect(isValidLongitude(NaN)).toBe(false);
    });
  });

  describe('isValidCoordinates', () => {
    it('应该验证有效的坐标数组', () => {
      expect(isValidCoordinates([0, 0])).toBe(true);
      expect(isValidCoordinates([180, 90])).toBe(true);
      expect(isValidCoordinates([-180, -90])).toBe(true);
    });

    it('应该拒绝无效的坐标数组', () => {
      expect(isValidCoordinates([181, 90])).toBe(false);
      expect(isValidCoordinates([180, 91])).toBe(false);
      expect(isValidCoordinates([NaN, 0])).toBe(false);
      expect(isValidCoordinates([0])).toBe(false);
      expect(isValidCoordinates([])).toBe(false);
      expect(isValidCoordinates(null)).toBe(false);
      expect(isValidCoordinates(undefined)).toBe(false);
    });
  });
});

describe('坐标处理函数', () => {
  describe('extractCoordinates', () => {
    it('应该从直接的经纬度字段提取坐标', () => {
      expect(extractCoordinates({ longitude: 120, latitude: 30 })).toEqual([120, 30]);
    });

    it('应该从lng/lat字段提取坐标', () => {
      expect(extractCoordinates({ lng: 120, lat: 30 })).toEqual([120, 30]);
    });

    it('应该从location数组提取坐标', () => {
      expect(extractCoordinates({ location: [120, 30] })).toEqual([120, 30]);
    });

    it('应该从coordinates数组提取坐标', () => {
      expect(extractCoordinates({ coordinates: [120, 30] })).toEqual([120, 30]);
    });

    it('应该从position数组提取坐标', () => {
      expect(extractCoordinates({ position: [120, 30] })).toEqual([120, 30]);
    });

    it('应该从geo对象提取坐标', () => {
      expect(extractCoordinates({ geo: { lng: 120, lat: 30 } })).toEqual([120, 30]);
    });

    it('应该从scenicSpot中提取坐标', () => {
      expect(extractCoordinates({
        scenicSpot: { longitude: 120, latitude: 30 }
      })).toEqual([120, 30]);
    });

    it('应该返回null当没有有效坐标时', () => {
      expect(extractCoordinates({})).toBeNull();
      expect(extractCoordinates(null)).toBeNull();
      expect(extractCoordinates(undefined)).toBeNull();
    });
  });

  describe('formatCoordinates', () => {
    it('应该格式化有效的坐标', () => {
      expect(formatCoordinates([120.123456, 30.654321])).toBe('30.654321, 120.123456');
    });

    it('应该处理null坐标', () => {
      expect(formatCoordinates(null)).toBe('无坐标');
    });
  });

  describe('parseCoordinatesString', () => {
    it('应该解析JSON数组格式', () => {
      expect(parseCoordinatesString('[120,30]')).toEqual([120, 30]);
    });

    it('应该解析JSON对象格式', () => {
      expect(parseCoordinatesString('{"lng":120,"lat":30}')).toEqual([120, 30]);
    });

    it('应该解析逗号分隔的格式', () => {
      expect(parseCoordinatesString('30,120')).toEqual([120, 30]);
    });

    it('应该返回null当格式无效时', () => {
      expect(parseCoordinatesString('invalid')).toBeNull();
      expect(parseCoordinatesString('')).toBeNull();
    });
  });
}); 