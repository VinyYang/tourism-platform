/**
 * 中国地理数据 - 包含省份和城市信息
 * 数据包括省份、城市名称和地理坐标
 */

// 城市信息接口
export interface CityInfo {
  name: string;           // 城市名称
  location: [number, number]; // [经度, 纬度]
  province: string;       // 所属省份
  level?: string;         // 城市级别：省级、地级、县级等
  code?: string;          // 城市编码（可选）
  pinyin?: string;        // 拼音（可选，用于搜索）
}

// 省份信息接口
export interface ProvinceInfo {
  name: string;           // 省份名称
  code: string;           // 省份编码
  location?: [number, number]; // 省份中心点坐标[经度, 纬度]
  cities: CityInfo[];     // 省份包含的城市
}

// 中国地理数据
export const chinaGeoData: ProvinceInfo[] = [
  {
    name: '北京市',
    code: '110000',
    location: [116.405285, 39.904989],
    cities: [
      { name: '北京', location: [116.407394, 39.904211], province: '北京市', level: '省级', pinyin: 'beijing' },
      { name: '朝阳区', location: [116.443108, 39.92147], province: '北京市', level: '区级', pinyin: 'chaoyang' },
      { name: '海淀区', location: [116.298056, 39.959912], province: '北京市', level: '区级', pinyin: 'haidian' },
      { name: '丰台区', location: [116.287039, 39.858427], province: '北京市', level: '区级', pinyin: 'fengtai' },
      { name: '石景山区', location: [116.222982, 39.906611], province: '北京市', level: '区级', pinyin: 'shijingshan' },
      { name: '房山区', location: [116.143267, 39.749144], province: '北京市', level: '区级', pinyin: 'fangshan' },
      { name: '门头沟区', location: [116.102009, 39.940646], province: '北京市', level: '区级', pinyin: 'mentougou' },
      { name: '通州区', location: [116.656435, 39.909946], province: '北京市', level: '区级', pinyin: 'tongzhou' },
      { name: '顺义区', location: [116.654651, 40.130347], province: '北京市', level: '区级', pinyin: 'shunyi' },
      { name: '昌平区', location: [116.231204, 40.220804], province: '北京市', level: '区级', pinyin: 'changping' },
      { name: '大兴区', location: [116.341014, 39.726929], province: '北京市', level: '区级', pinyin: 'daxing' },
      { name: '怀柔区', location: [116.637122, 40.324272], province: '北京市', level: '区级', pinyin: 'huairou' },
      { name: '平谷区', location: [117.121383, 40.140701], province: '北京市', level: '区级', pinyin: 'pinggu' },
      { name: '密云区', location: [116.843177, 40.376834], province: '北京市', level: '区级', pinyin: 'miyun' },
      { name: '延庆区', location: [115.974848, 40.456951], province: '北京市', level: '区级', pinyin: 'yanqing' }
    ]
  },
  {
    name: '天津市',
    code: '120000',
    location: [117.190182, 39.125596],
    cities: [
      { name: '天津', location: [117.190182, 39.125596], province: '天津市', level: '省级', pinyin: 'tianjin' },
      { name: '和平区', location: [117.214699, 39.117196], province: '天津市', level: '区级', pinyin: 'heping' },
      { name: '河东区', location: [117.251587, 39.128291], province: '天津市', level: '区级', pinyin: 'hedong' },
      { name: '河西区', location: [117.223372, 39.109563], province: '天津市', level: '区级', pinyin: 'hexi' },
      { name: '南开区', location: [117.150735, 39.138204], province: '天津市', level: '区级', pinyin: 'nankai' },
      { name: '河北区', location: [117.196648, 39.148028], province: '天津市', level: '区级', pinyin: 'hebei' },
      { name: '红桥区', location: [117.151533, 39.167345], province: '天津市', level: '区级', pinyin: 'hongqiao' },
      { name: '东丽区', location: [117.314324, 39.086569], province: '天津市', level: '区级', pinyin: 'dongli' },
      { name: '西青区', location: [117.008478, 39.141152], province: '天津市', level: '区级', pinyin: 'xiqing' },
      { name: '津南区', location: [117.357259, 38.937035], province: '天津市', level: '区级', pinyin: 'jinnan' },
      { name: '北辰区', location: [117.13482, 39.224792], province: '天津市', level: '区级', pinyin: 'beichen' },
      { name: '武清区', location: [117.044387, 39.384119], province: '天津市', level: '区级', pinyin: 'wuqing' },
      { name: '宝坻区', location: [117.309863, 39.716928], province: '天津市', level: '区级', pinyin: 'baodi' },
      { name: '滨海新区', location: [117.698074, 39.01773], province: '天津市', level: '区级', pinyin: 'binhai' },
      { name: '宁河区', location: [117.826724, 39.330087], province: '天津市', level: '区级', pinyin: 'ninghe' },
      { name: '静海区', location: [116.974232, 38.947512], province: '天津市', level: '区级', pinyin: 'jinghai' },
      { name: '蓟州区', location: [117.408296, 40.045851], province: '天津市', level: '区级', pinyin: 'jizhou' }
    ]
  },
  {
    name: '河北省',
    code: '130000',
    location: [114.502461, 38.045474],
    cities: [
      { name: '石家庄', location: [114.502461, 38.045474], province: '河北省', level: '地级市', pinyin: 'shijiazhuang' },
      { name: '唐山', location: [118.175393, 39.635113], province: '河北省', level: '地级市', pinyin: 'tangshan' },
      { name: '秦皇岛', location: [119.586579, 39.942531], province: '河北省', level: '地级市', pinyin: 'qinhuangdao' },
      { name: '邯郸', location: [114.490686, 36.612273], province: '河北省', level: '地级市', pinyin: 'handan' },
      { name: '邢台', location: [114.508851, 37.0682], province: '河北省', level: '地级市', pinyin: 'xingtai' },
      { name: '保定', location: [115.482331, 38.867657], province: '河北省', level: '地级市', pinyin: 'baoding' },
      { name: '张家口', location: [114.884091, 40.811901], province: '河北省', level: '地级市', pinyin: 'zhangjiakou' },
      { name: '承德', location: [117.939152, 40.976204], province: '河北省', level: '地级市', pinyin: 'chengde' },
      { name: '沧州', location: [116.857461, 38.310582], province: '河北省', level: '地级市', pinyin: 'cangzhou' },
      { name: '廊坊', location: [116.704441, 39.523927], province: '河北省', level: '地级市', pinyin: 'langfang' },
      { name: '衡水', location: [115.665993, 37.735097], province: '河北省', level: '地级市', pinyin: 'hengshui' }
    ]
  },
  {
    name: '山西省',
    code: '140000',
    location: [112.549248, 37.857014],
    cities: [
      { name: '太原', location: [112.549248, 37.857014], province: '山西省', level: '地级市', pinyin: 'taiyuan' },
      { name: '大同', location: [113.295259, 40.09031], province: '山西省', level: '地级市', pinyin: 'datong' },
      { name: '阳泉', location: [113.583285, 37.861188], province: '山西省', level: '地级市', pinyin: 'yangquan' },
      { name: '长治', location: [113.113556, 36.191112], province: '山西省', level: '地级市', pinyin: 'changzhi' },
      { name: '晋城', location: [112.851274, 35.497553], province: '山西省', level: '地级市', pinyin: 'jincheng' },
      { name: '朔州', location: [112.433387, 39.331261], province: '山西省', level: '地级市', pinyin: 'shuozhou' },
      { name: '晋中', location: [112.736465, 37.696495], province: '山西省', level: '地级市', pinyin: 'jinzhong' },
      { name: '运城', location: [111.007528, 35.026412], province: '山西省', level: '地级市', pinyin: 'yuncheng' },
      { name: '忻州', location: [112.733538, 38.41769], province: '山西省', level: '地级市', pinyin: 'xinzhou' },
      { name: '临汾', location: [111.517973, 36.08415], province: '山西省', level: '地级市', pinyin: 'linfen' },
      { name: '吕梁', location: [111.134335, 37.524366], province: '山西省', level: '地级市', pinyin: 'lvliang' }
    ]
  },
  {
    name: '内蒙古自治区',
    code: '150000',
    location: [111.670801, 40.818311],
    cities: [
      { name: '呼和浩特', location: [111.670801, 40.818311], province: '内蒙古自治区', level: '地级市', pinyin: 'huhehaote' },
      { name: '包头', location: [109.840405, 40.658168], province: '内蒙古自治区', level: '地级市', pinyin: 'baotou' },
      { name: '乌海', location: [106.825563, 39.673734], province: '内蒙古自治区', level: '地级市', pinyin: 'wuhai' },
      { name: '赤峰', location: [118.956806, 42.275317], province: '内蒙古自治区', level: '地级市', pinyin: 'chifeng' },
      { name: '通辽', location: [122.263119, 43.617429], province: '内蒙古自治区', level: '地级市', pinyin: 'tongliao' },
      { name: '鄂尔多斯', location: [109.99029, 39.817179], province: '内蒙古自治区', level: '地级市', pinyin: 'eerduosi' },
      { name: '呼伦贝尔', location: [119.758168, 49.215333], province: '内蒙古自治区', level: '地级市', pinyin: 'hulunbeier' },
      { name: '巴彦淖尔', location: [107.416962, 40.757402], province: '内蒙古自治区', level: '地级市', pinyin: 'bayannaoer' },
      { name: '乌兰察布', location: [113.114543, 41.034126], province: '内蒙古自治区', level: '地级市', pinyin: 'wulanchabu' },
      { name: '兴安盟', location: [122.070317, 46.076268], province: '内蒙古自治区', level: '盟', pinyin: 'xinganmeng' },
      { name: '锡林郭勒盟', location: [116.090996, 43.944018], province: '内蒙古自治区', level: '盟', pinyin: 'xilinguolemeng' },
      { name: '阿拉善盟', location: [105.706422, 38.844814], province: '内蒙古自治区', level: '盟', pinyin: 'alashanmeng' }
    ]
  },
  {
    name: '辽宁省',
    code: '210000',
    location: [123.429096, 41.796767],
    cities: [
      { name: '沈阳', location: [123.429096, 41.796767], province: '辽宁省', level: '地级市', pinyin: 'shenyang' },
      { name: '大连', location: [121.618622, 38.91459], province: '辽宁省', level: '地级市', pinyin: 'dalian' },
      { name: '鞍山', location: [122.995632, 41.110626], province: '辽宁省', level: '地级市', pinyin: 'anshan' },
      { name: '抚顺', location: [123.921109, 41.875956], province: '辽宁省', level: '地级市', pinyin: 'fushun' },
      { name: '本溪', location: [123.770519, 41.297909], province: '辽宁省', level: '地级市', pinyin: 'benxi' },
      { name: '丹东', location: [124.383044, 40.124296], province: '辽宁省', level: '地级市', pinyin: 'dandong' },
      { name: '锦州', location: [121.135742, 41.119269], province: '辽宁省', level: '地级市', pinyin: 'jinzhou' },
      { name: '营口', location: [122.235151, 40.667432], province: '辽宁省', level: '地级市', pinyin: 'yingkou' },
      { name: '阜新', location: [121.670322, 42.021619], province: '辽宁省', level: '地级市', pinyin: 'fuxin' },
      { name: '辽阳', location: [123.18152, 41.269402], province: '辽宁省', level: '地级市', pinyin: 'liaoyang' },
      { name: '盘锦', location: [122.06957, 41.124484], province: '辽宁省', level: '地级市', pinyin: 'panjin' },
      { name: '铁岭', location: [123.844279, 42.290585], province: '辽宁省', level: '地级市', pinyin: 'tieling' },
      { name: '朝阳', location: [120.451176, 41.576758], province: '辽宁省', level: '地级市', pinyin: 'chaoyang' },
      { name: '葫芦岛', location: [120.856394, 40.755572], province: '辽宁省', level: '地级市', pinyin: 'huludao' }
    ]
  },
  {
    name: '吉林省',
    code: '220000',
    location: [125.3245, 43.886841],
    cities: [
      { name: '长春', location: [125.3245, 43.886841], province: '吉林省', level: '地级市', pinyin: 'changchun' },
      { name: '吉林', location: [126.55302, 43.843577], province: '吉林省', level: '地级市', pinyin: 'jilin' },
      { name: '四平', location: [124.370785, 43.170344], province: '吉林省', level: '地级市', pinyin: 'siping' },
      { name: '辽源', location: [125.145349, 42.902692], province: '吉林省', level: '地级市', pinyin: 'liaoyuan' },
      { name: '通化', location: [125.936501, 41.721177], province: '吉林省', level: '地级市', pinyin: 'tonghua' },
      { name: '白山', location: [126.427839, 41.942505], province: '吉林省', level: '地级市', pinyin: 'baishan' },
      { name: '松原', location: [124.823608, 45.118243], province: '吉林省', level: '地级市', pinyin: 'songyuan' },
      { name: '白城', location: [122.841114, 45.619026], province: '吉林省', level: '地级市', pinyin: 'baicheng' },
      { name: '延边朝鲜族自治州', location: [129.513228, 42.904823], province: '吉林省', level: '自治州', pinyin: 'yanbian' }
    ]
  },
  {
    name: '黑龙江省',
    code: '230000',
    location: [126.642464, 45.756967],
    cities: [
      { name: '哈尔滨', location: [126.642464, 45.756967], province: '黑龙江省', level: '地级市', pinyin: 'haerbin' },
      { name: '齐齐哈尔', location: [123.95792, 47.342081], province: '黑龙江省', level: '地级市', pinyin: 'qiqihaer' },
      { name: '鸡西', location: [130.975966, 45.300046], province: '黑龙江省', level: '地级市', pinyin: 'jixi' },
      { name: '鹤岗', location: [130.277487, 47.332085], province: '黑龙江省', level: '地级市', pinyin: 'hegang' },
      { name: '双鸭山', location: [131.157304, 46.643442], province: '黑龙江省', level: '地级市', pinyin: 'shuangyashan' },
      { name: '大庆', location: [125.11272, 46.590734], province: '黑龙江省', level: '地级市', pinyin: 'daqing' },
      { name: '伊春', location: [128.899396, 47.724775], province: '黑龙江省', level: '地级市', pinyin: 'yichun' },
      { name: '佳木斯', location: [130.361634, 46.809606], province: '黑龙江省', level: '地级市', pinyin: 'jiamusi' },
      { name: '七台河', location: [131.015584, 45.771266], province: '黑龙江省', level: '地级市', pinyin: 'qitaihe' },
      { name: '牡丹江', location: [129.618602, 44.582962], province: '黑龙江省', level: '地级市', pinyin: 'mudanjiang' },
      { name: '黑河', location: [127.499023, 50.249585], province: '黑龙江省', level: '地级市', pinyin: 'heihe' },
      { name: '绥化', location: [126.99293, 46.637393], province: '黑龙江省', level: '地级市', pinyin: 'suihua' },
      { name: '大兴安岭地区', location: [124.711526, 52.335262], province: '黑龙江省', level: '地区', pinyin: 'daxinganling' }
    ]
  },
  {
    name: '上海市',
    code: '310000',
    location: [121.472644, 31.231706],
    cities: [
      { name: '上海', location: [121.472644, 31.231706], province: '上海市', level: '省级', pinyin: 'shanghai' },
      { name: '黄浦区', location: [121.484443, 31.231763], province: '上海市', level: '区级', pinyin: 'huangpu' },
      { name: '徐汇区', location: [121.43752, 31.188523], province: '上海市', level: '区级', pinyin: 'xuhui' },
      { name: '长宁区', location: [121.424624, 31.220367], province: '上海市', level: '区级', pinyin: 'changning' },
      { name: '静安区', location: [121.459384, 31.247105], province: '上海市', level: '区级', pinyin: 'jingan' },
      { name: '普陀区', location: [121.395555, 31.249813], province: '上海市', level: '区级', pinyin: 'putuo' },
      { name: '虹口区', location: [121.505133, 31.2646], province: '上海市', level: '区级', pinyin: 'hongkou' },
      { name: '杨浦区', location: [121.526077, 31.259541], province: '上海市', level: '区级', pinyin: 'yangpu' },
      { name: '闵行区', location: [121.381709, 31.112813], province: '上海市', level: '区级', pinyin: 'minhang' },
      { name: '宝山区', location: [121.489934, 31.4045], province: '上海市', level: '区级', pinyin: 'baoshan' },
      { name: '嘉定区', location: [121.266917, 31.375602], province: '上海市', level: '区级', pinyin: 'jiading' },
      { name: '浦东新区', location: [121.567706, 31.245944], province: '上海市', level: '区级', pinyin: 'pudong' },
      { name: '金山区', location: [121.342462, 30.741991], province: '上海市', level: '区级', pinyin: 'jinshan' },
      { name: '松江区', location: [121.227747, 31.032242], province: '上海市', level: '区级', pinyin: 'songjiang' },
      { name: '青浦区', location: [121.124178, 31.150681], province: '上海市', level: '区级', pinyin: 'qingpu' },
      { name: '奉贤区', location: [121.474056, 30.917795], province: '上海市', level: '区级', pinyin: 'fengxian' },
      { name: '崇明区', location: [121.397516, 31.626946], province: '上海市', level: '区级', pinyin: 'chongming' }
    ]
  },
  {
    name: '江苏省',
    code: '320000',
    location: [118.767413, 32.041544],
    cities: [
      { name: '南京', location: [118.767413, 32.041544], province: '江苏省', level: '地级市', pinyin: 'nanjing' },
      { name: '无锡', location: [120.301663, 31.574729], province: '江苏省', level: '地级市', pinyin: 'wuxi' },
      { name: '徐州', location: [117.184811, 34.261792], province: '江苏省', level: '地级市', pinyin: 'xuzhou' },
      { name: '常州', location: [119.946973, 31.772752], province: '江苏省', level: '地级市', pinyin: 'changzhou' },
      { name: '苏州', location: [120.619585, 31.299379], province: '江苏省', level: '地级市', pinyin: 'suzhou' },
      { name: '南通', location: [120.864608, 32.016212], province: '江苏省', level: '地级市', pinyin: 'nantong' },
      { name: '连云港', location: [119.178821, 34.600018], province: '江苏省', level: '地级市', pinyin: 'lianyungang' },
      { name: '淮安', location: [119.021265, 33.597506], province: '江苏省', level: '地级市', pinyin: 'huaian' },
      { name: '盐城', location: [120.139998, 33.377631], province: '江苏省', level: '地级市', pinyin: 'yancheng' },
      { name: '扬州', location: [119.421003, 32.393159], province: '江苏省', level: '地级市', pinyin: 'yangzhou' },
      { name: '镇江', location: [119.452753, 32.204402], province: '江苏省', level: '地级市', pinyin: 'zhenjiang' },
      { name: '泰州', location: [119.915176, 32.484882], province: '江苏省', level: '地级市', pinyin: 'taizhou' },
      { name: '宿迁', location: [118.275162, 33.963008], province: '江苏省', level: '地级市', pinyin: 'suqian' }
    ]
  },
  {
    name: '浙江省',
    code: '330000',
    location: [120.153576, 30.287459],
    cities: [
      { name: '杭州', location: [120.153576, 30.287459], province: '浙江省', level: '地级市', pinyin: 'hangzhou' },
      { name: '宁波', location: [121.549792, 29.868388], province: '浙江省', level: '地级市', pinyin: 'ningbo' },
      { name: '温州', location: [120.699367, 27.994267], province: '浙江省', level: '地级市', pinyin: 'wenzhou' },
      { name: '嘉兴', location: [120.750865, 30.762653], province: '浙江省', level: '地级市', pinyin: 'jiaxing' },
      { name: '湖州', location: [120.102398, 30.867198], province: '浙江省', level: '地级市', pinyin: 'huzhou' },
      { name: '绍兴', location: [120.582112, 29.997117], province: '浙江省', level: '地级市', pinyin: 'shaoxing' },
      { name: '金华', location: [119.649506, 29.089524], province: '浙江省', level: '地级市', pinyin: 'jinhua' },
      { name: '衢州', location: [118.87263, 28.941708], province: '浙江省', level: '地级市', pinyin: 'quzhou' },
      { name: '舟山', location: [122.106863, 30.016028], province: '浙江省', level: '地级市', pinyin: 'zhoushan' },
      { name: '台州', location: [121.428599, 28.661378], province: '浙江省', level: '地级市', pinyin: 'taizhou' },
      { name: '丽水', location: [119.921786, 28.451993], province: '浙江省', level: '地级市', pinyin: 'lishui' }
    ]
  },
  {
    name: '安徽省',
    code: '340000',
    location: [117.283042, 31.86119],
    cities: [
      { name: '合肥', location: [117.283042, 31.86119], province: '安徽省', level: '地级市', pinyin: 'hefei' },
      { name: '芜湖', location: [118.376451, 31.326319], province: '安徽省', level: '地级市', pinyin: 'wuhu' },
      { name: '蚌埠', location: [117.363228, 32.939667], province: '安徽省', level: '地级市', pinyin: 'bengbu' },
      { name: '淮南', location: [117.018329, 32.647574], province: '安徽省', level: '地级市', pinyin: 'huainan' },
      { name: '马鞍山', location: [118.507906, 31.689362], province: '安徽省', level: '地级市', pinyin: 'maanshan' },
      { name: '淮北', location: [116.798265, 33.955844], province: '安徽省', level: '地级市', pinyin: 'huaibei' },
      { name: '铜陵', location: [117.816576, 30.929935], province: '安徽省', level: '地级市', pinyin: 'tongling' },
      { name: '安庆', location: [117.043551, 30.50883], province: '安徽省', level: '地级市', pinyin: 'anqing' },
      { name: '黄山', location: [118.317325, 29.709239], province: '安徽省', level: '地级市', pinyin: 'huangshan' },
      { name: '滁州', location: [118.316264, 32.303627], province: '安徽省', level: '地级市', pinyin: 'chuzhou' },
      { name: '阜阳', location: [115.819729, 32.896969], province: '安徽省', level: '地级市', pinyin: 'fuyang' },
      { name: '宿州', location: [116.984084, 33.633891], province: '安徽省', level: '地级市', pinyin: 'suzhou' },
      { name: '六安', location: [116.507676, 31.752889], province: '安徽省', level: '地级市', pinyin: 'luan' },
      { name: '亳州', location: [115.782939, 33.869338], province: '安徽省', level: '地级市', pinyin: 'bozhou' },
      { name: '池州', location: [117.489157, 30.656037], province: '安徽省', level: '地级市', pinyin: 'chizhou' },
      { name: '宣城', location: [118.757995, 30.945667], province: '安徽省', level: '地级市', pinyin: 'xuancheng' }
    ]
  },
  {
    name: '福建省',
    code: '350000',
    location: [119.306239, 26.075302],
    cities: [
      { name: '福州', location: [119.306239, 26.075302], province: '福建省', level: '地级市', pinyin: 'fuzhou' },
      { name: '厦门', location: [118.11022, 24.490474], province: '福建省', level: '地级市', pinyin: 'xiamen' },
      { name: '莆田', location: [119.007558, 25.431011], province: '福建省', level: '地级市', pinyin: 'putian' },
      { name: '三明', location: [117.635001, 26.265444], province: '福建省', level: '地级市', pinyin: 'sanming' },
      { name: '泉州', location: [118.589421, 24.908853], province: '福建省', level: '地级市', pinyin: 'quanzhou' },
      { name: '漳州', location: [117.661801, 24.510897], province: '福建省', level: '地级市', pinyin: 'zhangzhou' },
      { name: '南平', location: [118.178459, 26.635627], province: '福建省', level: '地级市', pinyin: 'nanping' },
      { name: '龙岩', location: [117.02978, 25.091603], province: '福建省', level: '地级市', pinyin: 'longyan' },
      { name: '宁德', location: [119.527082, 26.65924], province: '福建省', level: '地级市', pinyin: 'ningde' }
    ]
  },
  {
    name: '江西省',
    code: '360000',
    location: [115.892151, 28.676493],
    cities: [
      { name: '南昌', location: [115.892151, 28.676493], province: '江西省', level: '地级市', pinyin: 'nanchang' },
      { name: '景德镇', location: [117.214664, 29.29256], province: '江西省', level: '地级市', pinyin: 'jingdezhen' },
      { name: '萍乡', location: [113.852186, 27.622946], province: '江西省', level: '地级市', pinyin: 'pingxiang' },
      { name: '九江', location: [116.001951, 29.705077], province: '江西省', level: '地级市', pinyin: 'jiujiang' },
      { name: '新余', location: [114.930835, 27.810834], province: '江西省', level: '地级市', pinyin: 'xinyu' },
      { name: '鹰潭', location: [117.033838, 28.238638], province: '江西省', level: '地级市', pinyin: 'yingtan' },
      { name: '赣州', location: [114.940278, 25.85097], province: '江西省', level: '地级市', pinyin: 'ganzhou' },
      { name: '吉安', location: [114.986373, 27.111699], province: '江西省', level: '地级市', pinyin: 'jian' },
      { name: '宜春', location: [114.391136, 27.8043], province: '江西省', level: '地级市', pinyin: 'yichun' },
      { name: '抚州', location: [116.358351, 27.98385], province: '江西省', level: '地级市', pinyin: 'fuzhou' },
      { name: '上饶', location: [117.971185, 28.44442], province: '江西省', level: '地级市', pinyin: 'shangrao' }
    ]
  },
  {
    name: '山东省',
    code: '370000',
    location: [117.000923, 36.675807],
    cities: [
      { name: '济南', location: [117.000923, 36.675807], province: '山东省', level: '地级市', pinyin: 'jinan' },
      { name: '青岛', location: [120.355173, 36.082982], province: '山东省', level: '地级市', pinyin: 'qingdao' },
      { name: '淄博', location: [118.047648, 36.814939], province: '山东省', level: '地级市', pinyin: 'zibo' },
      { name: '枣庄', location: [117.557964, 34.856424], province: '山东省', level: '地级市', pinyin: 'zaozhuang' },
      { name: '东营', location: [118.66471, 37.434564], province: '山东省', level: '地级市', pinyin: 'dongying' },
      { name: '烟台', location: [121.391382, 37.539297], province: '山东省', level: '地级市', pinyin: 'yantai' },
      { name: '潍坊', location: [119.107078, 36.70925], province: '山东省', level: '地级市', pinyin: 'weifang' },
      { name: '济宁', location: [116.587245, 35.415393], province: '山东省', level: '地级市', pinyin: 'jining' },
      { name: '泰安', location: [117.129063, 36.194968], province: '山东省', level: '地级市', pinyin: 'taian' },
      { name: '威海', location: [122.116394, 37.509691], province: '山东省', level: '地级市', pinyin: 'weihai' },
      { name: '日照', location: [119.461208, 35.428588], province: '山东省', level: '地级市', pinyin: 'rizhao' },
      { name: '临沂', location: [118.326443, 35.065282], province: '山东省', level: '地级市', pinyin: 'linyi' },
      { name: '德州', location: [116.307428, 37.453968], province: '山东省', level: '地级市', pinyin: 'dezhou' },
      { name: '聊城', location: [115.980367, 36.456013], province: '山东省', level: '地级市', pinyin: 'liaocheng' },
      { name: '滨州', location: [118.016974, 37.383542], province: '山东省', level: '地级市', pinyin: 'binzhou' },
      { name: '菏泽', location: [115.469381, 35.246531], province: '山东省', level: '地级市', pinyin: 'heze' }
    ]
  },
  {
    name: '河南省',
    code: '410000',
    location: [113.665412, 34.757975],
    cities: [
      { name: '郑州', location: [113.665412, 34.757975], province: '河南省', level: '地级市', pinyin: 'zhengzhou' },
      { name: '开封', location: [114.341447, 34.797049], province: '河南省', level: '地级市', pinyin: 'kaifeng' },
      { name: '洛阳', location: [112.434468, 34.663041], province: '河南省', level: '地级市', pinyin: 'luoyang' },
      { name: '平顶山', location: [113.307718, 33.735241], province: '河南省', level: '地级市', pinyin: 'pingdingshan' },
      { name: '安阳', location: [114.352482, 36.103442], province: '河南省', level: '地级市', pinyin: 'anyang' },
      { name: '鹤壁', location: [114.295444, 35.748236], province: '河南省', level: '地级市', pinyin: 'hebi' },
      { name: '新乡', location: [113.883991, 35.302616], province: '河南省', level: '地级市', pinyin: 'xinxiang' },
      { name: '焦作', location: [113.238266, 35.23904], province: '河南省', level: '地级市', pinyin: 'jiaozuo' },
      { name: '濮阳', location: [115.041299, 35.768234], province: '河南省', level: '地级市', pinyin: 'puyang' },
      { name: '许昌', location: [113.826063, 34.022956], province: '河南省', level: '地级市', pinyin: 'xuchang' },
      { name: '漯河', location: [114.026405, 33.575855], province: '河南省', level: '地级市', pinyin: 'luohe' },
      { name: '三门峡', location: [111.194099, 34.777338], province: '河南省', level: '地级市', pinyin: 'sanmenxia' },
      { name: '南阳', location: [112.540918, 32.999082], province: '河南省', level: '地级市', pinyin: 'nanyang' },
      { name: '商丘', location: [115.650497, 34.437054], province: '河南省', level: '地级市', pinyin: 'shangqiu' },
      { name: '信阳', location: [114.075031, 32.123274], province: '河南省', level: '地级市', pinyin: 'xinyang' },
      { name: '周口', location: [114.649653, 33.620357], province: '河南省', level: '地级市', pinyin: 'zhoukou' },
      { name: '驻马店', location: [114.024736, 32.980169], province: '河南省', level: '地级市', pinyin: 'zhumadian' },
      { name: '济源', location: [112.590047, 35.090378], province: '河南省', level: '县级市', pinyin: 'jiyuan' }
    ]
  },
  {
    name: '湖北省',
    code: '420000',
    location: [114.298572, 30.584355],
    cities: [
      { name: '武汉', location: [114.298572, 30.584355], province: '湖北省', level: '地级市', pinyin: 'wuhan' },
      { name: '黄石', location: [115.077048, 30.220074], province: '湖北省', level: '地级市', pinyin: 'huangshi' },
      { name: '十堰', location: [110.787916, 32.646907], province: '湖北省', level: '地级市', pinyin: 'shiyan' },
      { name: '宜昌', location: [111.290843, 30.702636], province: '湖北省', level: '地级市', pinyin: 'yichang' },
      { name: '襄阳', location: [112.144146, 32.042426], province: '湖北省', level: '地级市', pinyin: 'xiangyang' },
      { name: '鄂州', location: [114.890593, 30.396536], province: '湖北省', level: '地级市', pinyin: 'ezhou' },
      { name: '荆门', location: [112.204251, 31.03542], province: '湖北省', level: '地级市', pinyin: 'jingmen' },
      { name: '孝感', location: [113.926655, 30.926423], province: '湖北省', level: '地级市', pinyin: 'xiaogan' },
      { name: '荆州', location: [112.23813, 30.326857], province: '湖北省', level: '地级市', pinyin: 'jingzhou' },
      { name: '黄冈', location: [114.879365, 30.447711], province: '湖北省', level: '地级市', pinyin: 'huanggang' },
      { name: '咸宁', location: [114.328963, 29.832798], province: '湖北省', level: '地级市', pinyin: 'xianning' },
      { name: '随州', location: [113.37377, 31.717497], province: '湖北省', level: '地级市', pinyin: 'suizhou' },
      { name: '恩施', location: [109.48699, 30.283114], province: '湖北省', level: '自治州', pinyin: 'enshi' },
      { name: '仙桃', location: [113.453974, 30.364953], province: '湖北省', level: '县级市', pinyin: 'xiantao' },
      { name: '潜江', location: [112.896866, 30.421215], province: '湖北省', level: '县级市', pinyin: 'qianjiang' },
      { name: '天门', location: [113.165862, 30.653061], province: '湖北省', level: '县级市', pinyin: 'tianmen' },
      { name: '神农架', location: [109.48699, 31.074843], province: '湖北省', level: '林区', pinyin: 'shennongjia' }
    ]
  },
  {
    name: '湖南省',
    code: '430000',
    location: [112.982279, 28.19409],
    cities: [
      { name: '长沙', location: [112.982279, 28.19409], province: '湖南省', level: '地级市', pinyin: 'changsha' },
      { name: '株洲', location: [113.151737, 27.835806], province: '湖南省', level: '地级市', pinyin: 'zhuzhou' },
      { name: '湘潭', location: [112.944052, 27.82973], province: '湖南省', level: '地级市', pinyin: 'xiangtan' },
      { name: '衡阳', location: [112.607693, 26.900358], province: '湖南省', level: '地级市', pinyin: 'hengyang' },
      { name: '邵阳', location: [111.46923, 27.237842], province: '湖南省', level: '地级市', pinyin: 'shaoyang' },
      { name: '岳阳', location: [113.132855, 29.37029], province: '湖南省', level: '地级市', pinyin: 'yueyang' },
      { name: '常德', location: [111.691347, 29.040225], province: '湖南省', level: '地级市', pinyin: 'changde' },
      { name: '张家界', location: [110.479921, 29.127401], province: '湖南省', level: '地级市', pinyin: 'zhangjiajie' },
      { name: '益阳', location: [112.355042, 28.570066], province: '湖南省', level: '地级市', pinyin: 'yiyang' },
      { name: '郴州', location: [113.032067, 25.793589], province: '湖南省', level: '地级市', pinyin: 'chenzhou' },
      { name: '永州', location: [111.608019, 26.434516], province: '湖南省', level: '地级市', pinyin: 'yongzhou' },
      { name: '怀化', location: [109.97824, 27.550082], province: '湖南省', level: '地级市', pinyin: 'huaihua' },
      { name: '娄底', location: [112.008497, 27.728136], province: '湖南省', level: '地级市', pinyin: 'loudi' },
      { name: '湘西', location: [109.739735, 28.314296], province: '湖南省', level: '自治州', pinyin: 'xiangxi' }
    ]
  },
  {
    name: '广东省',
    code: '440000',
    location: [113.280637, 23.125178],
    cities: [
      { name: '广州', location: [113.280637, 23.125178], province: '广东省', level: '地级市', pinyin: 'guangzhou' },
      { name: '韶关', location: [113.591544, 24.801322], province: '广东省', level: '地级市', pinyin: 'shaoguan' },
      { name: '深圳', location: [114.085947, 22.547], province: '广东省', level: '地级市', pinyin: 'shenzhen' },
      { name: '珠海', location: [113.553986, 22.224979], province: '广东省', level: '地级市', pinyin: 'zhuhai' },
      { name: '汕头', location: [116.708463, 23.37102], province: '广东省', level: '地级市', pinyin: 'shantou' },
      { name: '佛山', location: [113.122717, 23.028762], province: '广东省', level: '地级市', pinyin: 'foshan' },
      { name: '江门', location: [113.094942, 22.590431], province: '广东省', level: '地级市', pinyin: 'jiangmen' },
      { name: '湛江', location: [110.364977, 21.274898], province: '广东省', level: '地级市', pinyin: 'zhanjiang' },
      { name: '茂名', location: [110.919229, 21.659751], province: '广东省', level: '地级市', pinyin: 'maoming' },
      { name: '肇庆', location: [112.472529, 23.051546], province: '广东省', level: '地级市', pinyin: 'zhaoqing' },
      { name: '惠州', location: [114.412599, 23.079404], province: '广东省', level: '地级市', pinyin: 'huizhou' },
      { name: '梅州', location: [116.117582, 24.299112], province: '广东省', level: '地级市', pinyin: 'meizhou' },
      { name: '汕尾', location: [115.364238, 22.774485], province: '广东省', level: '地级市', pinyin: 'shanwei' },
      { name: '河源', location: [114.697802, 23.746266], province: '广东省', level: '地级市', pinyin: 'heyuan' },
      { name: '阳江', location: [111.975107, 21.859222], province: '广东省', level: '地级市', pinyin: 'yangjiang' },
      { name: '清远', location: [113.051227, 23.685022], province: '广东省', level: '地级市', pinyin: 'qingyuan' },
      { name: '东莞', location: [113.746262, 23.046237], province: '广东省', level: '地级市', pinyin: 'dongguan' },
      { name: '中山', location: [113.382391, 22.521113], province: '广东省', level: '地级市', pinyin: 'zhongshan' },
      { name: '潮州', location: [116.632301, 23.661701], province: '广东省', level: '地级市', pinyin: 'chaozhou' },
      { name: '揭阳', location: [116.355733, 23.543778], province: '广东省', level: '地级市', pinyin: 'jieyang' },
      { name: '云浮', location: [112.044439, 22.929801], province: '广东省', level: '地级市', pinyin: 'yunfu' }
    ]
  },
  {
    name: '广西壮族自治区',
    code: '450000',
    location: [108.320004, 22.82402],
    cities: [
      { name: '南宁', location: [108.320004, 22.82402], province: '广西壮族自治区', level: '地级市', pinyin: 'nanning' },
      { name: '柳州', location: [109.411703, 24.314617], province: '广西壮族自治区', level: '地级市', pinyin: 'liuzhou' },
      { name: '桂林', location: [110.299121, 25.274215], province: '广西壮族自治区', level: '地级市', pinyin: 'guilin' },
      { name: '梧州', location: [111.297604, 23.474803], province: '广西壮族自治区', level: '地级市', pinyin: 'wuzhou' },
      { name: '北海', location: [109.119254, 21.473343], province: '广西壮族自治区', level: '地级市', pinyin: 'beihai' },
      { name: '防城港', location: [108.345478, 21.614631], province: '广西壮族自治区', level: '地级市', pinyin: 'fangchenggang' },
      { name: '钦州', location: [108.624175, 21.967127], province: '广西壮族自治区', level: '地级市', pinyin: 'qinzhou' },
      { name: '贵港', location: [109.602146, 23.0936], province: '广西壮族自治区', level: '地级市', pinyin: 'guigang' },
      { name: '玉林', location: [110.154393, 22.63136], province: '广西壮族自治区', level: '地级市', pinyin: 'yulin' },
      { name: '百色', location: [106.616285, 23.897742], province: '广西壮族自治区', level: '地级市', pinyin: 'baise' },
      { name: '贺州', location: [111.552056, 24.414141], province: '广西壮族自治区', level: '地级市', pinyin: 'hezhou' },
      { name: '河池', location: [108.062105, 24.695899], province: '广西壮族自治区', level: '地级市', pinyin: 'hechi' },
      { name: '来宾', location: [109.229772, 23.733766], province: '广西壮族自治区', level: '地级市', pinyin: 'laibin' },
      { name: '崇左', location: [107.353926, 22.404108], province: '广西壮族自治区', level: '地级市', pinyin: 'chongzuo' }
    ]
  },
  {
    name: '海南省',
    code: '460000',
    location: [110.33119, 20.031971],
    cities: [
      { name: '海口', location: [110.33119, 20.031971], province: '海南省', level: '地级市', pinyin: 'haikou' },
      { name: '三亚', location: [109.508268, 18.247872], province: '海南省', level: '地级市', pinyin: 'sanya' },
      { name: '三沙', location: [112.34882, 16.831039], province: '海南省', level: '地级市', pinyin: 'sansha' },
      { name: '儋州', location: [109.576782, 19.517486], province: '海南省', level: '地级市', pinyin: 'danzhou' },
      { name: '五指山', location: [109.516662, 18.776921], province: '海南省', level: '县级市', pinyin: 'wuzhishan' },
      { name: '琼海', location: [110.466785, 19.246011], province: '海南省', level: '县级市', pinyin: 'qionghai' },
      { name: '文昌', location: [110.753975, 19.612986], province: '海南省', level: '县级市', pinyin: 'wenchang' },
      { name: '万宁', location: [110.388793, 18.796216], province: '海南省', level: '县级市', pinyin: 'wanning' },
      { name: '东方', location: [108.653789, 19.10198], province: '海南省', level: '县级市', pinyin: 'dongfang' },
      { name: '定安', location: [110.349235, 19.684966], province: '海南省', level: '县', pinyin: 'dingan' },
      { name: '屯昌', location: [110.102773, 19.362916], province: '海南省', level: '县', pinyin: 'tunchang' },
      { name: '澄迈', location: [110.007147, 19.737095], province: '海南省', level: '县', pinyin: 'chengmai' },
      { name: '临高', location: [109.687697, 19.908293], province: '海南省', level: '县', pinyin: 'lingao' },
      { name: '白沙', location: [109.452606, 19.224584], province: '海南省', level: '自治县', pinyin: 'baisha' },
      { name: '昌江', location: [109.053351, 19.260968], province: '海南省', level: '自治县', pinyin: 'changjiang' },
      { name: '乐东', location: [109.175444, 18.74758], province: '海南省', level: '自治县', pinyin: 'ledong' },
      { name: '陵水', location: [110.037218, 18.505006], province: '海南省', level: '自治县', pinyin: 'lingshui' },
      { name: '保亭', location: [109.70245, 18.636371], province: '海南省', level: '自治县', pinyin: 'baoting' },
      { name: '琼中', location: [109.839996, 19.03557], province: '海南省', level: '自治县', pinyin: 'qiongzhong' }
    ]
  },
  {
    name: '重庆市',
    code: '500000',
    location: [106.504962, 29.533155],
    cities: [
      { name: '重庆', location: [106.504962, 29.533155], province: '重庆市', level: '省级', pinyin: 'chongqing' },
      { name: '万州区', location: [108.380246, 30.807807], province: '重庆市', level: '区级', pinyin: 'wanzhou' },
      { name: '涪陵区', location: [107.394905, 29.703652], province: '重庆市', level: '区级', pinyin: 'fuling' },
      { name: '渝中区', location: [106.56288, 29.556742], province: '重庆市', level: '区级', pinyin: 'yuzhong' },
      { name: '大渡口区', location: [106.482347, 29.481002], province: '重庆市', level: '区级', pinyin: 'dadukou' },
      { name: '江北区', location: [106.532844, 29.575352], province: '重庆市', level: '区级', pinyin: 'jiangbei' },
      { name: '沙坪坝区', location: [106.4542, 29.541224], province: '重庆市', level: '区级', pinyin: 'shapingba' },
      { name: '九龙坡区', location: [106.480989, 29.523492], province: '重庆市', level: '区级', pinyin: 'jiulongpo' },
      { name: '南岸区', location: [106.560813, 29.523992], province: '重庆市', level: '区级', pinyin: 'nanan' },
      { name: '北碚区', location: [106.437868, 29.82543], province: '重庆市', level: '区级', pinyin: 'beibei' },
      { name: '綦江区', location: [106.651417, 29.028091], province: '重庆市', level: '区级', pinyin: 'qijiang' },
      { name: '大足区', location: [105.768121, 29.700498], province: '重庆市', level: '区级', pinyin: 'dazu' },
      { name: '渝北区', location: [106.512851, 29.601451], province: '重庆市', level: '区级', pinyin: 'yubei' },
      { name: '巴南区', location: [106.519423, 29.381919], province: '重庆市', level: '区级', pinyin: 'banan' },
      { name: '黔江区', location: [108.782577, 29.527548], province: '重庆市', level: '区级', pinyin: 'qianjiang' },
      { name: '长寿区', location: [107.074854, 29.833671], province: '重庆市', level: '区级', pinyin: 'changshou' },
      { name: '江津区', location: [106.253156, 29.283387], province: '重庆市', level: '区级', pinyin: 'jiangjin' },
      { name: '合川区', location: [106.265554, 29.990993], province: '重庆市', level: '区级', pinyin: 'hechuan' },
      { name: '永川区', location: [105.894714, 29.348748], province: '重庆市', level: '区级', pinyin: 'yongchuan' },
      { name: '南川区', location: [107.098153, 29.156646], province: '重庆市', level: '区级', pinyin: 'nanchuan' },
      { name: '璧山区', location: [106.231126, 29.593581], province: '重庆市', level: '区级', pinyin: 'bishan' },
      { name: '铜梁区', location: [106.054948, 29.839944], province: '重庆市', level: '区级', pinyin: 'tongliang' },
      { name: '潼南区', location: [105.841818, 30.189554], province: '重庆市', level: '区级', pinyin: 'tongnan' },
      { name: '荣昌区', location: [105.594061, 29.403627], province: '重庆市', level: '区级', pinyin: 'rongchang' },
      { name: '开州区', location: [108.413317, 31.167735], province: '重庆市', level: '区级', pinyin: 'kaizhou' },
      { name: '梁平区', location: [107.800034, 30.672168], province: '重庆市', level: '区级', pinyin: 'liangping' },
      { name: '武隆区', location: [107.75655, 29.32376], province: '重庆市', level: '区级', pinyin: 'wulong' },
      { name: '城口县', location: [108.6649, 31.946293], province: '重庆市', level: '县级', pinyin: 'chengkou' },
      { name: '丰都县', location: [107.73248, 29.866424], province: '重庆市', level: '县级', pinyin: 'fengdu' },
      { name: '垫江县', location: [107.348692, 30.330012], province: '重庆市', level: '县级', pinyin: 'dianjiang' },
      { name: '忠县', location: [108.037518, 30.291537], province: '重庆市', level: '县级', pinyin: 'zhongxian' },
      { name: '云阳县', location: [108.697698, 30.930529], province: '重庆市', level: '县级', pinyin: 'yunyang' },
      { name: '奉节县', location: [109.465774, 31.019967], province: '重庆市', level: '县级', pinyin: 'fengjie' },
      { name: '巫山县', location: [109.878928, 31.074843], province: '重庆市', level: '县级', pinyin: 'wushan' },
      { name: '巫溪县', location: [109.628912, 31.3966], province: '重庆市', level: '县级', pinyin: 'wuxi' },
      { name: '石柱县', location: [108.112448, 29.99853], province: '重庆市', level: '自治县', pinyin: 'shizhu' },
      { name: '秀山县', location: [108.996043, 28.444772], province: '重庆市', level: '自治县', pinyin: 'xiushan' },
      { name: '酉阳县', location: [108.767201, 28.839828], province: '重庆市', level: '自治县', pinyin: 'youyang' },
      { name: '彭水县', location: [108.166551, 29.293856], province: '重庆市', level: '自治县', pinyin: 'pengshui' }
    ]
  },
  {
    name: '四川省',
    code: '510000',
    location: [104.065735, 30.659462],
    cities: [
      { name: '成都', location: [104.065735, 30.659462], province: '四川省', level: '地级市', pinyin: 'chengdu' },
      { name: '自贡', location: [104.773447, 29.352765], province: '四川省', level: '地级市', pinyin: 'zigong' },
      { name: '攀枝花', location: [101.716007, 26.580446], province: '四川省', level: '地级市', pinyin: 'panzhihua' },
      { name: '泸州', location: [105.443348, 28.889138], province: '四川省', level: '地级市', pinyin: 'luzhou' },
      { name: '德阳', location: [104.398651, 31.127991], province: '四川省', level: '地级市', pinyin: 'deyang' },
      { name: '绵阳', location: [104.741722, 31.46402], province: '四川省', level: '地级市', pinyin: 'mianyang' },
      { name: '广元', location: [105.829757, 32.433668], province: '四川省', level: '地级市', pinyin: 'guangyuan' },
      { name: '遂宁', location: [105.571331, 30.513311], province: '四川省', level: '地级市', pinyin: 'suining' },
      { name: '内江', location: [105.066138, 29.58708], province: '四川省', level: '地级市', pinyin: 'neijiang' },
      { name: '乐山', location: [103.761263, 29.582024], province: '四川省', level: '地级市', pinyin: 'leshan' },
      { name: '南充', location: [106.082974, 30.795281], province: '四川省', level: '地级市', pinyin: 'nanchong' },
      { name: '眉山', location: [103.831788, 30.048318], province: '四川省', level: '地级市', pinyin: 'meishan' },
      { name: '宜宾', location: [104.630825, 28.760189], province: '四川省', level: '地级市', pinyin: 'yibin' },
      { name: '广安', location: [106.633369, 30.456398], province: '四川省', level: '地级市', pinyin: 'guangan' },
      { name: '达州', location: [107.502262, 31.209484], province: '四川省', level: '地级市', pinyin: 'dazhou' },
      { name: '雅安', location: [103.001033, 29.987722], province: '四川省', level: '地级市', pinyin: 'yaan' },
      { name: '巴中', location: [106.753669, 31.858809], province: '四川省', level: '地级市', pinyin: 'bazhong' },
      { name: '资阳', location: [104.641917, 30.122211], province: '四川省', level: '地级市', pinyin: 'ziyang' },
      { name: '阿坝', location: [102.221374, 31.899792], province: '四川省', level: '自治州', pinyin: 'aba' },
      { name: '甘孜', location: [101.963815, 30.050663], province: '四川省', level: '自治州', pinyin: 'ganzi' },
      { name: '凉山', location: [102.258746, 27.886762], province: '四川省', level: '自治州', pinyin: 'liangshan' }
    ]
  },
  {
    name: '贵州省',
    code: '520000',
    location: [106.713478, 26.578343],
    cities: [
      { name: '贵阳', location: [106.713478, 26.578343], province: '贵州省', level: '地级市', pinyin: 'guiyang' },
      { name: '六盘水', location: [104.846743, 26.584643], province: '贵州省', level: '地级市', pinyin: 'liupanshui' },
      { name: '遵义', location: [106.937265, 27.706626], province: '贵州省', level: '地级市', pinyin: 'zunyi' },
      { name: '安顺', location: [105.932188, 26.245544], province: '贵州省', level: '地级市', pinyin: 'anshun' },
      { name: '毕节', location: [105.28501, 27.301693], province: '贵州省', level: '地级市', pinyin: 'bijie' },
      { name: '铜仁', location: [109.191555, 27.718346], province: '贵州省', level: '地级市', pinyin: 'tongren' },
      { name: '黔西南', location: [104.897971, 25.08812], province: '贵州省', level: '自治州', pinyin: 'qianxinan' },
      { name: '黔东南', location: [107.977488, 26.583352], province: '贵州省', level: '自治州', pinyin: 'qiandongnan' },
      { name: '黔南', location: [107.517156, 26.258219], province: '贵州省', level: '自治州', pinyin: 'qiannan' }
    ]
  },
  {
    name: '云南省',
    code: '530000',
    location: [102.712251, 25.040609],
    cities: [
      { name: '昆明', location: [102.712251, 25.040609], province: '云南省', level: '地级市', pinyin: 'kunming' },
      { name: '曲靖', location: [103.797851, 25.501557], province: '云南省', level: '地级市', pinyin: 'qujing' },
      { name: '玉溪', location: [102.543907, 24.350461], province: '云南省', level: '地级市', pinyin: 'yuxi' },
      { name: '保山', location: [99.167133, 25.111802], province: '云南省', level: '地级市', pinyin: 'baoshan' },
      { name: '昭通', location: [103.717216, 27.336999], province: '云南省', level: '地级市', pinyin: 'zhaotong' },
      { name: '丽江', location: [100.233026, 26.872108], province: '云南省', level: '地级市', pinyin: 'lijiang' },
      { name: '普洱', location: [100.972344, 22.777321], province: '云南省', level: '地级市', pinyin: 'puer' },
      { name: '临沧', location: [100.08697, 23.886567], province: '云南省', level: '地级市', pinyin: 'lincang' },
      { name: '楚雄', location: [101.546046, 25.041988], province: '云南省', level: '自治州', pinyin: 'chuxiong' },
      { name: '红河', location: [103.384182, 23.366775], province: '云南省', level: '自治州', pinyin: 'honghe' },
      { name: '文山', location: [104.24401, 23.36951], province: '云南省', level: '自治州', pinyin: 'wenshan' },
      { name: '西双版纳', location: [100.797941, 22.001724], province: '云南省', level: '自治州', pinyin: 'xishuangbanna' },
      { name: '大理', location: [100.225668, 25.589449], province: '云南省', level: '自治州', pinyin: 'dali' },
      { name: '德宏', location: [98.578363, 24.436694], province: '云南省', level: '自治州', pinyin: 'dehong' },
      { name: '怒江', location: [98.854304, 25.850949], province: '云南省', level: '自治州', pinyin: 'nujiang' },
      { name: '迪庆', location: [99.706463, 27.826853], province: '云南省', level: '自治州', pinyin: 'diqing' }
    ]
  },
  {
    name: '西藏自治区',
    code: '540000',
    location: [91.132212, 29.660361],
    cities: [
      { name: '拉萨', location: [91.132212, 29.660361], province: '西藏自治区', level: '地级市', pinyin: 'lasa' },
      { name: '日喀则', location: [88.885148, 29.267519], province: '西藏自治区', level: '地级市', pinyin: 'rikaze' },
      { name: '昌都', location: [97.178452, 31.136875], province: '西藏自治区', level: '地级市', pinyin: 'changdu' },
      { name: '林芝', location: [94.362348, 29.654693], province: '西藏自治区', level: '地级市', pinyin: 'linzhi' },
      { name: '山南', location: [91.766529, 29.236023], province: '西藏自治区', level: '地级市', pinyin: 'shannan' },
      { name: '那曲', location: [92.060214, 31.476004], province: '西藏自治区', level: '地级市', pinyin: 'naqu' },
      { name: '阿里', location: [80.105498, 32.503187], province: '西藏自治区', level: '地区', pinyin: 'ali' }
    ]
  },
  {
    name: '陕西省',
    code: '610000',
    location: [108.948024, 34.263161],
    cities: [
      { name: '西安', location: [108.948024, 34.263161], province: '陕西省', level: '地级市', pinyin: 'xian' },
      { name: '铜川', location: [108.979608, 34.916582], province: '陕西省', level: '地级市', pinyin: 'tongchuan' },
      { name: '宝鸡', location: [107.14487, 34.369315], province: '陕西省', level: '地级市', pinyin: 'baoji' },
      { name: '咸阳', location: [108.705117, 34.333439], province: '陕西省', level: '地级市', pinyin: 'xianyang' },
      { name: '渭南', location: [109.502882, 34.499381], province: '陕西省', level: '地级市', pinyin: 'weinan' },
      { name: '延安', location: [109.49081, 36.596537], province: '陕西省', level: '地级市', pinyin: 'yanan' },
      { name: '汉中', location: [107.028621, 33.077668], province: '陕西省', level: '地级市', pinyin: 'hanzhong' },
      { name: '榆林', location: [109.741193, 38.290162], province: '陕西省', level: '地级市', pinyin: 'yulin' },
      { name: '安康', location: [109.029273, 32.6903], province: '陕西省', level: '地级市', pinyin: 'ankang' },
      { name: '商洛', location: [109.939776, 33.868319], province: '陕西省', level: '地级市', pinyin: 'shangluo' }
    ]
  },
  {
    name: '甘肃省',
    code: '620000',
    location: [103.823557, 36.058039],
    cities: [
      { name: '兰州', location: [103.823557, 36.058039], province: '甘肃省', level: '地级市', pinyin: 'lanzhou' },
      { name: '嘉峪关', location: [98.277304, 39.786529], province: '甘肃省', level: '地级市', pinyin: 'jiayuguan' },
      { name: '金昌', location: [102.187888, 38.514238], province: '甘肃省', level: '地级市', pinyin: 'jinchang' },
      { name: '白银', location: [104.173606, 36.54568], province: '甘肃省', level: '地级市', pinyin: 'baiyin' },
      { name: '天水', location: [105.724998, 34.578529], province: '甘肃省', level: '地级市', pinyin: 'tianshui' },
      { name: '武威', location: [102.634697, 37.929996], province: '甘肃省', level: '地级市', pinyin: 'wuwei' },
      { name: '张掖', location: [100.455472, 38.932897], province: '甘肃省', level: '地级市', pinyin: 'zhangye' },
      { name: '平凉', location: [106.684691, 35.54279], province: '甘肃省', level: '地级市', pinyin: 'pingliang' },
      { name: '酒泉', location: [98.510795, 39.744023], province: '甘肃省', level: '地级市', pinyin: 'jiuquan' },
      { name: '庆阳', location: [107.638372, 35.734218], province: '甘肃省', level: '地级市', pinyin: 'qingyang' },
      { name: '定西', location: [104.626294, 35.579578], province: '甘肃省', level: '地级市', pinyin: 'dingxi' },
      { name: '陇南', location: [104.929379, 33.388598], province: '甘肃省', level: '地级市', pinyin: 'longnan' },
      { name: '临夏', location: [103.212006, 35.599446], province: '甘肃省', level: '自治州', pinyin: 'linxia' },
      { name: '甘南', location: [102.911008, 34.986354], province: '甘肃省', level: '自治州', pinyin: 'gannan' }
    ]
  },
  {
    name: '青海省',
    code: '630000',
    location: [101.778916, 36.623178],
    cities: [
      { name: '西宁', location: [101.778916, 36.623178], province: '青海省', level: '地级市', pinyin: 'xining' },
      { name: '海东', location: [102.10327, 36.502916], province: '青海省', level: '地级市', pinyin: 'haidong' },
      { name: '海北', location: [100.901059, 36.959435], province: '青海省', level: '自治州', pinyin: 'haibei' },
      { name: '黄南', location: [102.019988, 35.517744], province: '青海省', level: '自治州', pinyin: 'huangnan' },
      { name: '海南', location: [100.619542, 36.280353], province: '青海省', level: '自治州', pinyin: 'hainan' },
      { name: '果洛', location: [100.242143, 34.4736], province: '青海省', level: '自治州', pinyin: 'guoluo' },
      { name: '玉树', location: [97.008522, 33.004049], province: '青海省', level: '自治州', pinyin: 'yushu' },
      { name: '海西', location: [97.370785, 37.374663], province: '青海省', level: '自治州', pinyin: 'haixi' }
    ]
  },
  {
    name: '宁夏回族自治区',
    code: '640000',
    location: [106.278179, 38.46637],
    cities: [
      { name: '银川', location: [106.278179, 38.46637], province: '宁夏回族自治区', level: '地级市', pinyin: 'yinchuan' },
      { name: '石嘴山', location: [106.376173, 39.01333], province: '宁夏回族自治区', level: '地级市', pinyin: 'shizuishan' },
      { name: '吴忠', location: [106.199409, 37.986165], province: '宁夏回族自治区', level: '地级市', pinyin: 'wuzhong' },
      { name: '固原', location: [106.285241, 36.004561], province: '宁夏回族自治区', level: '地级市', pinyin: 'guyuan' },
      { name: '中卫', location: [105.189568, 37.514951], province: '宁夏回族自治区', level: '地级市', pinyin: 'zhongwei' }
    ]
  },
  {
    name: '新疆维吾尔自治区',
    code: '650000',
    location: [87.617733, 43.792818],
    cities: [
      { name: '乌鲁木齐', location: [87.617733, 43.792818], province: '新疆维吾尔自治区', level: '地级市', pinyin: 'wulumuqi' },
      { name: '克拉玛依', location: [84.873946, 45.595886], province: '新疆维吾尔自治区', level: '地级市', pinyin: 'kelamayi' },
      { name: '吐鲁番', location: [89.169899, 42.951303], province: '新疆维吾尔自治区', level: '地级市', pinyin: 'tulufan' },
      { name: '哈密', location: [93.51316, 42.833248], province: '新疆维吾尔自治区', level: '地级市', pinyin: 'hami' },
      { name: '昌吉', location: [87.304012, 44.014577], province: '新疆维吾尔自治区', level: '自治州', pinyin: 'changji' },
      { name: '博尔塔拉', location: [82.074778, 44.903258], province: '新疆维吾尔自治区', level: '自治州', pinyin: 'boertala' },
      { name: '巴音郭楞', location: [86.150969, 41.768552], province: '新疆维吾尔自治区', level: '自治州', pinyin: 'bayinguoleng' },
      { name: '阿克苏', location: [80.265068, 41.170712], province: '新疆维吾尔自治区', level: '地区', pinyin: 'akesu' },
      { name: '克孜勒苏', location: [76.172825, 39.713431], province: '新疆维吾尔自治区', level: '自治州', pinyin: 'kezilesu' },
      { name: '喀什', location: [75.989138, 39.467664], province: '新疆维吾尔自治区', level: '地区', pinyin: 'kashen' },
      { name: '和田', location: [79.92533, 37.110687], province: '新疆维吾尔自治区', level: '地区', pinyin: 'hetian' },
      { name: '伊犁', location: [81.317946, 43.92186], province: '新疆维吾尔自治区', level: '自治州', pinyin: 'yili' },
      { name: '塔城', location: [82.985732, 46.746301], province: '新疆维吾尔自治区', level: '地区', pinyin: 'tacheng' },
      { name: '阿勒泰', location: [88.13963, 47.848393], province: '新疆维吾尔自治区', level: '地区', pinyin: 'aletai' },
      { name: '石河子', location: [86.041075, 44.305886], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'shihezi' },
      { name: '阿拉尔', location: [81.285884, 40.541914], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'alaer' },
      { name: '图木舒克', location: [79.077978, 39.867316], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'tumushuke' },
      { name: '五家渠', location: [87.526884, 44.167401], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'wujiaqu' },
      { name: '北屯', location: [87.824932, 47.362728], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'beitun' },
      { name: '铁门关', location: [85.501218, 41.827251], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'tiemenguan' },
      { name: '双河', location: [82.353656, 44.840524], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'shuanghe' },
      { name: '可克达拉', location: [81.044542, 43.6832], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'kekedala' },
      { name: '昆玉', location: [79.291083, 37.207994], province: '新疆维吾尔自治区', level: '县级市', pinyin: 'kunyu' }
    ]
  },
  {
    name: '台湾省',
    code: '710000',
    location: [121.509062, 25.044332],
    cities: [
      { name: '台北', location: [121.509062, 25.044332], province: '台湾省', level: '地级市', pinyin: 'taibei' },
      { name: '高雄', location: [120.301435, 22.627278], province: '台湾省', level: '地级市', pinyin: 'gaoxiong' },
      { name: '基隆', location: [121.746248, 25.130741], province: '台湾省', level: '地级市', pinyin: 'jilong' },
      { name: '台中', location: [120.679032, 24.143538], province: '台湾省', level: '地级市', pinyin: 'taizhong' },
      { name: '台南', location: [120.193649, 22.997147], province: '台湾省', level: '地级市', pinyin: 'tainan' },
      { name: '新竹', location: [120.968798, 24.806738], province: '台湾省', level: '地级市', pinyin: 'xinzhu' },
      { name: '嘉义', location: [120.452538, 23.481568], province: '台湾省', level: '地级市', pinyin: 'jiayi' },
      { name: '宜兰', location: [121.753476, 24.69578], province: '台湾省', level: '县', pinyin: 'yilan' },
      { name: '桃园', location: [121.214313, 24.993383], province: '台湾省', level: '县', pinyin: 'taoyuan' },
      { name: '苗栗', location: [120.818985, 24.560159], province: '台湾省', level: '县', pinyin: 'miaoli' },
      { name: '彰化', location: [120.535269, 24.075198], province: '台湾省', level: '县', pinyin: 'zhanghua' },
      { name: '南投', location: [120.971869, 23.959676], province: '台湾省', level: '县', pinyin: 'nantou' },
      { name: '云林', location: [120.527173, 23.698375], province: '台湾省', level: '县', pinyin: 'yunlin' },
      { name: '屏东', location: [120.492005, 22.668392], province: '台湾省', level: '县', pinyin: 'pingdong' },
      { name: '台东', location: [121.113207, 22.758307], province: '台湾省', level: '县', pinyin: 'taidong' },
      { name: '花莲', location: [121.606927, 23.983431], province: '台湾省', level: '县', pinyin: 'hualian' },
      { name: '澎湖', location: [119.585658, 23.566255], province: '台湾省', level: '县', pinyin: 'penghu' }
    ]
  },
  {
    name: '香港特别行政区',
    code: '810000',
    location: [114.173355, 22.320048],
    cities: [
      { name: '香港', location: [114.173355, 22.320048], province: '香港特别行政区', level: '特别行政区', pinyin: 'xianggang' },
      { name: '中西区', location: [114.154334, 22.282468], province: '香港特别行政区', level: '区', pinyin: 'zhongxiqu' },
      { name: '东区', location: [114.224953, 22.276851], province: '香港特别行政区', level: '区', pinyin: 'dongqu' },
      { name: '九龙城区', location: [114.195053, 22.32673], province: '香港特别行政区', level: '区', pinyin: 'jiulongchengqu' },
      { name: '观塘区', location: [114.231268, 22.30943], province: '香港特别行政区', level: '区', pinyin: 'guantangqu' },
      { name: '南区', location: [114.174134, 22.24676], province: '香港特别行政区', level: '区', pinyin: 'nanqu' },
      { name: '深水埗区', location: [114.167802, 22.328171], province: '香港特别行政区', level: '区', pinyin: 'shenshuibuqu' },
      { name: '湾仔区', location: [114.182687, 22.276925], province: '香港特别行政区', level: '区', pinyin: 'wanziqu' },
      { name: '黄大仙区', location: [114.19836, 22.336313], province: '香港特别行政区', level: '区', pinyin: 'huangdaxianqu' },
      { name: '油尖旺区', location: [114.173347, 22.311632], province: '香港特别行政区', level: '区', pinyin: 'youjianwangqu' },
      { name: '离岛区', location: [113.945433, 22.286039], province: '香港特别行政区', level: '区', pinyin: 'lidaoqu' },
      { name: '葵青区', location: [114.13918, 22.363908], province: '香港特别行政区', level: '区', pinyin: 'kuiqingqu' },
      { name: '北区', location: [114.143715, 22.494724], province: '香港特别行政区', level: '区', pinyin: 'beiqu' },
      { name: '西贡区', location: [114.27773, 22.379908], province: '香港特别行政区', level: '区', pinyin: 'xigongqu' },
      { name: '沙田区', location: [114.191941, 22.379294], province: '香港特别行政区', level: '区', pinyin: 'shatianqu' },
      { name: '屯门区', location: [113.977416, 22.391047], province: '香港特别行政区', level: '区', pinyin: 'tunmenqu' },
      { name: '大埔区', location: [114.171743, 22.44573], province: '香港特别行政区', level: '区', pinyin: 'dapuqu' },
      { name: '荃湾区', location: [114.122952, 22.370455], province: '香港特别行政区', level: '区', pinyin: 'quanwanqu' },
      { name: '元朗区', location: [114.032528, 22.443341], province: '香港特别行政区', level: '区', pinyin: 'yuanlangqu' }
    ]
  },
  {
    name: '澳门特别行政区',
    code: '820000',
    location: [113.54909, 22.198951],
    cities: [
      { name: '澳门', location: [113.54909, 22.198951], province: '澳门特别行政区', level: '特别行政区', pinyin: 'aomen' },
      { name: '花地玛堂区', location: [113.552114, 22.207882], province: '澳门特别行政区', level: '区', pinyin: 'huadimatangqu' },
      { name: '圣安多尼堂区', location: [113.563359, 22.12381], province: '澳门特别行政区', level: '区', pinyin: 'shenganduonitangqu' },
      { name: '大堂区', location: [113.554353, 22.188539], province: '澳门特别行政区', level: '区', pinyin: 'datangqu' },
      { name: '望德堂区', location: [113.55024, 22.193798], province: '澳门特别行政区', level: '区', pinyin: 'wangdetangqu' },
      { name: '风顺堂区', location: [113.541928, 22.187368], province: '澳门特别行政区', level: '区', pinyin: 'fengshuntangqu' },
      { name: '嘉模堂区', location: [113.558783, 22.154124], province: '澳门特别行政区', level: '区', pinyin: 'jiamotangqu' },
      { name: '圣方济各堂区', location: [113.554553, 22.12381], province: '澳门特别行政区', level: '区', pinyin: 'shengfangjigetangqu' },
      { name: '路氹城', location: [113.56925, 22.136546], province: '澳门特别行政区', level: '区', pinyin: 'ludangcheng' }
    ]
  }
];

// 将所有城市数据平铺成一个数组，方便查找
export const getAllCities = (): CityInfo[] => {
  return chinaGeoData.reduce<CityInfo[]>((cities, province) => {
    return [...cities, ...province.cities];
  }, []);
};

// 通过城市名称查找城市信息
export const findCityByName = (cityName: string): CityInfo | undefined => {
  const allCities = getAllCities();
  return allCities.find(city => city.name === cityName);
};

// 模糊匹配城市名称
export const findCitiesByNameFuzzy = (query: string): CityInfo[] => {
  if (!query || query.trim().length === 0) return [];
  
  const allCities = getAllCities();
  const normalizedQuery = query.trim().toLowerCase();
  
  return allCities.filter(city => {
    const cityName = city.name.toLowerCase();
    const provinceName = city.province.toLowerCase();
    const pinyin = city.pinyin?.toLowerCase() || '';
    
    return cityName.includes(normalizedQuery) || 
           provinceName.includes(normalizedQuery) ||
           pinyin.includes(normalizedQuery);
  });
};

// 获取所有省份名称
export const getAllProvinceNames = (): string[] => {
  return chinaGeoData.map(province => province.name);
};

// 根据省份名称获取城市列表
export const getCitiesByProvince = (provinceName: string): CityInfo[] => {
  const province = chinaGeoData.find(p => p.name === provinceName);
  return province ? province.cities : [];
};

// 获取热门城市列表
export const getPopularCities = (): CityInfo[] => {
  // 返回一些热门城市
  const popularCityNames = [
    '北京', '上海', '广州', '深圳', '南京', 
    '杭州', '重庆', '武汉', '成都', '西安'
  ];
  
  return getAllCities().filter(city => popularCityNames.includes(city.name));
}; 