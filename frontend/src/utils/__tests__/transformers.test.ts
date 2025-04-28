import { transformSpotsForMap, sortSpotsByOrder, validateSpotData } from '../transformers';
import { ApiSpot, MapSpot } from '../../@types/spot';

describe('数据转换工具', () => {
  describe('transformSpotsForMap', () => {
    it('应该转换有效的景点数据', () => {
      const input: ApiSpot[] = [
        {
          id: 1,
          name: '景点1',
          description: '描述1',
          location: [120, 30],
          order_number: 1
        },
        {
          id: 2,
          name: '景点2',
          description: '描述2',
          latitude: 31,
          longitude: 121,
          order_number: 2
        }
      ];

      const expected: MapSpot[] = [
        {
          id: 1,
          name: '景点1',
          description: '描述1',
          location: [120, 30],
          order_number: 1
        },
        {
          id: 2,
          name: '景点2',
          description: '描述2',
          location: [121, 31],
          order_number: 2
        }
      ];

      expect(transformSpotsForMap(input)).toEqual(expected);
    });

    it('应该处理空输入', () => {
      expect(transformSpotsForMap(undefined)).toEqual([]);
      expect(transformSpotsForMap(null)).toEqual([]);
      expect(transformSpotsForMap([])).toEqual([]);
    });

    it('应该从scenicSpot中提取数据', () => {
      const input: ApiSpot[] = [
        {
          id: 1,
          name: '景点1',
          scenicSpot: {
            scenic_id: 101,
            name: '景区1',
            description: '景区描述1',
            location: [120, 30]
          },
          order_number: 1
        }
      ];

      const expected: MapSpot[] = [
        {
          id: 101,
          name: '景区1',
          description: '景区描述1',
          location: [120, 30],
          order_number: 1,
          scenicSpot: input[0].scenicSpot
        }
      ];

      expect(transformSpotsForMap(input)).toEqual(expected);
    });

    it('应该过滤掉无效的景点', () => {
      const input: ApiSpot[] = [
        {
          id: 1,
          name: '景点1',
          description: '描述1',
          location: [120, 30],
          order_number: 1
        },
        {
          id: 2,
          name: '景点2',
          description: '描述2',
          order_number: 2
        }
      ];

      const expected: MapSpot[] = [
        {
          id: 1,
          name: '景点1',
          description: '描述1',
          location: [120, 30],
          order_number: 1
        }
      ];

      expect(transformSpotsForMap(input)).toEqual(expected);
    });
  });

  describe('sortSpotsByOrder', () => {
    it('应该按order_number排序', () => {
      const input = [
        { id: 1, order_number: 3 },
        { id: 2, order_number: 1 },
        { id: 3, order_number: 2 }
      ];

      const expected = [
        { id: 2, order_number: 1 },
        { id: 3, order_number: 2 },
        { id: 1, order_number: 3 }
      ];

      expect(sortSpotsByOrder(input)).toEqual(expected);
    });

    it('应该处理缺失的order_number', () => {
      const input = [
        { id: 1 },
        { id: 2, order_number: 1 },
        { id: 3 }
      ];

      const expected = [
        { id: 2, order_number: 1 },
        { id: 1 },
        { id: 3 }
      ];

      expect(sortSpotsByOrder(input)).toEqual(expected);
    });
  });

  describe('validateSpotData', () => {
    it('应该验证有效的景点数据', () => {
      const validSpot: ApiSpot = {
        id: 1,
        name: '景点1',
        location: [120, 30]
      };

      expect(validateSpotData(validSpot)).toBe(true);
    });

    it('应该拒绝无效的景点数据', () => {
      const invalidSpots = [
        undefined,
        null,
        {},
        { id: 1 },
        { id: 1, name: '景点1' },
        { id: 1, name: '景点1', location: null }
      ];

      invalidSpots.forEach(spot => {
        expect(validateSpotData(spot as ApiSpot)).toBe(false);
      });
    });
  });
}); 