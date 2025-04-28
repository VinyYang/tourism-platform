/**
 * 城市控制器 - 处理城市相关的请求
 */

// 热门城市数据（静态数据）
const popularCities = [
  {
    id: 1,
    name: '北京',
    province: '北京市',
    description: '探索北京的魅力',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d'
  },
  {
    id: 2,
    name: '上海',
    province: '上海市',
    description: '探索上海的魅力',
    image: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f'
  },
  {
    id: 3,
    name: '广州',
    province: '广东省',
    description: '探索广州的魅力',
    image: 'https://images.unsplash.com/photo-1591819080910-592ae1f10d65'
  },
  {
    id: 4,
    name: '深圳',
    province: '广东省',
    description: '探索深圳的魅力',
    image: 'https://images.unsplash.com/photo-1505993597083-3bd19fb75e57'
  },
  {
    id: 5,
    name: '杭州',
    province: '浙江省',
    description: '探索杭州的魅力',
    image: 'https://images.unsplash.com/photo-1599783896315-7c42c15bdc85'
  },
  {
    id: 6,
    name: '南京',
    province: '江苏省',
    description: '探索南京的魅力',
    image: 'https://images.unsplash.com/photo-1527525443983-6e42c1f851c1'
  },
  {
    id: 7,
    name: '成都',
    province: '四川省',
    description: '探索成都的魅力',
    image: 'https://images.unsplash.com/photo-1513140696372-544474f8519a'
  },
  {
    id: 8,
    name: '武汉',
    province: '湖北省',
    description: '探索武汉的魅力',
    image: 'https://images.unsplash.com/photo-1622177875918-9655c6b2262a'
  },
  {
    id: 9,
    name: '西安',
    province: '陕西省',
    description: '探索西安的魅力',
    image: 'https://images.unsplash.com/photo-1548105670-691e15b581c1'
  },
  {
    id: 10,
    name: '重庆',
    province: '重庆市',
    description: '探索重庆的魅力',
    image: 'https://images.unsplash.com/photo-1579255899730-5d7c1d4b7e6c'
  },
  {
    id: 11,
    name: '厦门',
    province: '福建省',
    description: '探索厦门的魅力',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da'
  },
  {
    id: 12,
    name: '青岛',
    province: '山东省',
    description: '探索青岛的魅力',
    image: 'https://images.unsplash.com/photo-1485144899632-4164f6322c9b'
  },
  {
    id: 13,
    name: '三亚',
    province: '海南省',
    description: '探索三亚的魅力',
    image: 'https://images.unsplash.com/photo-1549476466-351252f13a87'
  },
  {
    id: 14,
    name: '桂林',
    province: '广西壮族自治区',
    description: '探索桂林的魅力',
    image: 'https://images.unsplash.com/photo-1503803548661-819951be4822'
  },
  {
    id: 15,
    name: '丽江',
    province: '云南省',
    description: '探索丽江的魅力',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592'
  }
];

// 获取热门城市列表
exports.getPopularCities = (req, res) => {
  try {
    // 从查询参数中获取limit，默认为10
    const limit = parseInt(req.query.limit) || 10;
    
    // 截取指定数量的城市
    const limitedCities = popularCities.slice(0, limit);
    
    // 返回城市数据
    res.status(200).json({
      success: true,
      data: limitedCities,
      count: limitedCities.length,
      message: '获取热门城市成功'
    });
  } catch (error) {
    console.error('获取热门城市失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门城市失败',
      error: error.message
    });
  }
}; 