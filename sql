-- =============================================================================
-- 文件名: featured_data_examples_ordered.sql
-- 目的: 提供数据库表创建和示例数据，包含所有26个表的结构和scenic, featuredroute, featuredroutespot表的示例数据
-- 最后更新: 适配当前数据库表结构
-- =============================================================================
--
-- !! 非常重要：请仔细阅读以下说明 !!
--
-- 1. 执行顺序:
--    此脚本中的 SQL 语句 **必须** 按顺序执行。
--    首先创建所有表结构，然后插入 `scenic` 数据，之后是 `featuredroute`，最后是 `featuredroutespot`。
--    这是为了满足外键约束的要求。
--
-- 2. INSERT IGNORE:
--    在插入 `scenic` 和 `featuredroute` 数据时使用了 `INSERT IGNORE`。
--    这意味着如果数据库中已存在具有相同主键 ID (scenic_id 或 featured_route_id)
--    的记录，该条 `INSERT` 语句将被 **忽略**，不会报错。
--    **但是**，这并不保证后续 `featuredroutespot` 的插入一定成功。
--    如果因为其他原因（例如，记录存在但内容不同，或 ID 序列不匹配导致预期 ID 已被占用）
--    导致父记录未能按预期插入或存在，后续依赖这些 ID 的 `featuredroutespot` 插入
--    仍然会因为找不到父记录而触发外键约束错误 (ERROR 1452)。
--
-- 3. 明确指定的 ID:
--    此脚本中的示例数据使用了 `scenic_id` (从 1 到 31) 和 `featured_route_id` (从 1 到 10)
--    是 **硬编码/明确指定** 的。
--    `featuredroutespot` 的插入语句依赖于这些固定的 ID 值来建立关联。
--
-- 4. 适用环境与警告:
--    - 此脚本最适合在 **新数据库** 或 **表为空** 的数据库/测试环境中首次运行时使用。
--    - 如果在已有大量数据的生产表或 ID 不连续的表上运行此脚本：
--      a) `INSERT IGNORE` 可能导致部分或全部 `scenic`/`featuredroute` 数据未按预期插入。
--      b) 后续的 `featuredroutespot` 插入很可能因为找不到对应的父 ID 而 **失败**。
--    - **请在执行前备份您的数据，并在测试环境中充分验证！**
--
-- 5. 演示目的与实际应用差异:
--    - 此脚本主要用于 **创建完整的数据库结构和示例内容**。
--    - 它 **不** 代表生产环境中的标准数据导入流程。
--    - 实际应用程序通常会通过后端代码逻辑来处理数据的查找、创建和关联，
--      以确保数据一致性和处理各种边界情况，而不是直接运行此类批量指定 ID 的脚本。
--
-- =============================================================================

-- ===================== 数据库表结构创建 =====================

-- 创建backuplog表
CREATE TABLE IF NOT EXISTS backuplog (
  backup_id INT NOT NULL AUTO_INCREMENT,
  backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  backup_status ENUM('started','completed','failed') NOT NULL,
  tables_backed_up TEXT NOT NULL,
  error_message TEXT,
  PRIMARY KEY (backup_id)
);

-- 创建user表（需要先创建，因为其他表有外键依赖）
CREATE TABLE IF NOT EXISTS user (
  user_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user','advisor','admin') NOT NULL DEFAULT 'user',
  status ENUM('active','muted') NOT NULL DEFAULT 'active',
  avatar VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  cultural_dna_tags TEXT,
  PRIMARY KEY (user_id),
  UNIQUE KEY (username),
  UNIQUE KEY (email)
);

-- 创建scenic表
CREATE TABLE IF NOT EXISTS scenic (
  scenic_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  open_time VARCHAR(100) NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  images JSON NOT NULL,
  label VARCHAR(255) NOT NULL,
  hot_score INT NOT NULL DEFAULT 0,
  is_custom TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  location JSON,
  PRIMARY KEY (scenic_id),
  INDEX idx_name (name),
  INDEX idx_city (city),
  INDEX idx_label (label),
  INDEX idx_hot_score (hot_score),
  INDEX idx_is_custom (is_custom)
);

-- 创建hotel表
CREATE TABLE IF NOT EXISTS hotel (
  hotel_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  stars INT NOT NULL,
  price_range VARCHAR(50) NOT NULL,
  avg_price DECIMAL(10,2),
  type ENUM('豪华酒店','商务酒店','度假酒店','经济酒店','公寓酒店','精品酒店','民宿','其他'),
  images JSON NOT NULL,
  facilities JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (hotel_id),
  INDEX idx_city (city),
  INDEX idx_stars (stars),
  INDEX idx_avg_price (avg_price),
  INDEX idx_type (type)
);

-- 创建featuredroute表
CREATE TABLE IF NOT EXISTS featuredroute (
  featured_route_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(50),
  difficulty VARCHAR(20),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (featured_route_id)
);

-- 创建featuredroutespot表
CREATE TABLE IF NOT EXISTS featuredroutespot (
  featured_route_spot_id INT NOT NULL AUTO_INCREMENT,
  featured_route_id INT NOT NULL,
  scenic_id INT,
  order_number INT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  spot_name VARCHAR(100),
  spot_description TEXT,
  PRIMARY KEY (featured_route_spot_id),
  INDEX idx_featured_route_id (featured_route_id),
  INDEX idx_scenic_id (scenic_id),
  FOREIGN KEY (featured_route_id) REFERENCES featuredroute (featured_route_id),
  FOREIGN KEY (scenic_id) REFERENCES scenic (scenic_id)
);

-- 创建room表
CREATE TABLE IF NOT EXISTS room (
  room_id INT NOT NULL AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  beds VARCHAR(50),
  size VARCHAR(50),
  max_occupancy INT,
  images JSON,
  facilities JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  available_count INT DEFAULT 0,
  version INT DEFAULT 0,
  PRIMARY KEY (room_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_price (price),
  FOREIGN KEY (hotel_id) REFERENCES hotel (hotel_id)
);

-- 创建transport表
CREATE TABLE IF NOT EXISTS transport (
  transport_id INT NOT NULL AUTO_INCREMENT,
  transport_type ENUM('plane','train','bus','car') NOT NULL,
  from_city VARCHAR(50) NOT NULL,
  to_city VARCHAR(50) NOT NULL,
  company VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  duration INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (transport_id),
  INDEX idx_from_city (from_city),
  INDEX idx_to_city (to_city)
);

-- 创建strategy表
CREATE TABLE IF NOT EXISTS strategy (
  strategy_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  city VARCHAR(50) NOT NULL,
  cover_image VARCHAR(255) NOT NULL,
  tags VARCHAR(255) NOT NULL,
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  type ENUM('article','travel_note') NOT NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (strategy_id),
  INDEX idx_user_id (user_id),
  INDEX idx_city (city),
  INDEX idx_tags (tags),
  INDEX idx_view_count (view_count),
  INDEX idx_like_count (like_count),
  FOREIGN KEY (user_id) REFERENCES user (user_id)
);

-- 创建customizeditinerary表
CREATE TABLE IF NOT EXISTS customizeditinerary (
  itinerary_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  city VARCHAR(50),
  estimated_budget DECIMAL(10,2),
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  custom_url VARCHAR(255),
  cover TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (itinerary_id),
  INDEX idx_user_id (user_id),
  INDEX idx_city (city),
  UNIQUE KEY (custom_url),
  FOREIGN KEY (user_id) REFERENCES user (user_id)
);

-- 创建booking表
CREATE TABLE IF NOT EXISTS booking (
  booking_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  scenic_id INT,
  hotel_id INT,
  room_id INT,
  flight_id INT,
  booking_type ENUM('scenic','hotel','itinerary','flight') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  num_people INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  passenger_info TEXT,
  status ENUM('pending','processing','confirmed','completed','cancelled','refunding','refunded') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid','paid','refunded','refund_pending') NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (booking_id),
  INDEX idx_user_id (user_id),
  INDEX idx_scenic_id (scenic_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_room_id (room_id),
  INDEX idx_booking_type (booking_type),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  FOREIGN KEY (user_id) REFERENCES user (user_id),
  FOREIGN KEY (scenic_id) REFERENCES scenic (scenic_id),
  FOREIGN KEY (hotel_id) REFERENCES hotel (hotel_id),
  FOREIGN KEY (room_id) REFERENCES room (room_id)
);

-- 创建favorite表
CREATE TABLE IF NOT EXISTS favorite (
  favorite_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_type ENUM('scenic','hotel','strategy') NOT NULL,
  scenic_id INT,
  hotel_id INT,
  strategy_id INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (favorite_id),
  INDEX idx_user_id (user_id),
  INDEX idx_item_type (item_type),
  INDEX idx_scenic_id (scenic_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_strategy_id (strategy_id),
  FOREIGN KEY (user_id) REFERENCES user (user_id),
  FOREIGN KEY (scenic_id) REFERENCES scenic (scenic_id),
  FOREIGN KEY (hotel_id) REFERENCES hotel (hotel_id),
  FOREIGN KEY (strategy_id) REFERENCES strategy (strategy_id)
);

-- 创建itineraryitem表
CREATE TABLE IF NOT EXISTS itineraryitem (
  item_id INT NOT NULL AUTO_INCREMENT,
  itinerary_id INT NOT NULL,
  day_number INT NOT NULL,
  item_type VARCHAR(20),
  scenic_id INT,
  hotel_id INT,
  transport_id INT,
  name VARCHAR(255),
  image VARCHAR(255),
  location VARCHAR(255),
  start_time TIME,
  end_time TIME,
  notes TEXT,
  order_number INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  price DECIMAL(10,2),
  PRIMARY KEY (item_id),
  INDEX idx_itinerary_id (itinerary_id),
  INDEX idx_day_number (day_number),
  INDEX idx_scenic_id (scenic_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_transport_id (transport_id),
  FOREIGN KEY (itinerary_id) REFERENCES customizeditinerary (itinerary_id),
  FOREIGN KEY (scenic_id) REFERENCES scenic (scenic_id),
  FOREIGN KEY (hotel_id) REFERENCES hotel (hotel_id),
  FOREIGN KEY (transport_id) REFERENCES transport (transport_id)
);

-- 创建notification表
CREATE TABLE IF NOT EXISTS notification (
  notification_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  type ENUM('booking_status','system','promotion') NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  FOREIGN KEY (user_id) REFERENCES user (user_id)
);

-- 创建recoverylog表
CREATE TABLE IF NOT EXISTS recoverylog (
  recovery_id INT NOT NULL AUTO_INCREMENT,
  recovery_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  table_name VARCHAR(100) NOT NULL,
  recovery_point TIMESTAMP NOT NULL,
  status ENUM('started','completed','failed') NOT NULL,
  error_message TEXT,
  PRIMARY KEY (recovery_id)
);

-- 创建review表
CREATE TABLE IF NOT EXISTS review (
  review_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_type ENUM('scenic','hotel','strategy','booking') NOT NULL,
  scenic_id INT,
  hotel_id INT,
  strategy_id INT,
  booking_id INT,
  rating DECIMAL(2,1) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  INDEX idx_user_id (user_id),
  INDEX idx_item_type (item_type),
  INDEX idx_scenic_id (scenic_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_strategy_id (strategy_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_rating (rating),
  FOREIGN KEY (user_id) REFERENCES user (user_id),
  FOREIGN KEY (scenic_id) REFERENCES scenic (scenic_id),
  FOREIGN KEY (hotel_id) REFERENCES hotel (hotel_id),
  FOREIGN KEY (strategy_id) REFERENCES strategy (strategy_id),
  FOREIGN KEY (booking_id) REFERENCES booking (booking_id)
);

-- 创建strategylike表
CREATE TABLE IF NOT EXISTS strategylike (
  like_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  strategy_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (like_id),
  INDEX idx_user_id (user_id),
  INDEX idx_strategy_id (strategy_id),
  FOREIGN KEY (user_id) REFERENCES user (user_id),
  FOREIGN KEY (strategy_id) REFERENCES strategy (strategy_id)
);

-- 创建transactionlog表
CREATE TABLE IF NOT EXISTS transactionlog (
  log_id BIGINT NOT NULL AUTO_INCREMENT,
  operation_type ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id INT NOT NULL,
  old_data JSON,
  new_data JSON,
  user_id INT,
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  INDEX idx_table_name (table_name),
  INDEX idx_operation_time (operation_time)
);

-- 创建userpreference表
CREATE TABLE IF NOT EXISTS userpreference (
  preference_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  interest VARCHAR(255) NOT NULL,
  preferred_cities JSON NOT NULL,
  budget_range VARCHAR(50) NOT NULL,
  travel_style VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (preference_id),
  UNIQUE KEY (user_id),
  INDEX idx_interest (interest),
  FOREIGN KEY (user_id) REFERENCES user (user_id)
);

-- 创建视图
CREATE OR REPLACE VIEW view_bookingdetails AS
SELECT 
  b.booking_id, b.user_id, b.scenic_id, b.hotel_id, b.booking_type, 
  b.start_date, b.end_date, b.num_people, b.total_price, b.status, 
  b.payment_status, b.created_at, b.updated_at,
  u.username, u.email, u.phone,
  s.name as scenic_name, s.city as scenic_city, s.address as scenic_address, 
  s.ticket_price, JSON_EXTRACT(s.images, '$[0]') as scenic_image,
  h.name as hotel_name, h.city as hotel_city, h.address as hotel_address, 
  h.price_range, JSON_EXTRACT(h.images, '$[0]') as hotel_image
FROM booking b
LEFT JOIN user u ON b.user_id = u.user_id
LEFT JOIN scenic s ON b.scenic_id = s.scenic_id
LEFT JOIN hotel h ON b.hotel_id = h.hotel_id;

CREATE OR REPLACE VIEW view_cityscenicstats AS
SELECT 
  city, 
  COUNT(*) as scenic_count,
  AVG(ticket_price) as avg_price,
  MIN(ticket_price) as min_price,
  MAX(ticket_price) as max_price,
  AVG(hot_score) as avg_hot_score
FROM scenic
GROUP BY city;

CREATE OR REPLACE VIEW view_hotstrategies AS
SELECT 
  s.strategy_id, s.user_id, s.title, s.content, s.city, s.cover_image, 
  s.tags, s.view_count, s.like_count, s.type, s.status, s.created_at, s.updated_at,
  u.username, u.avatar
FROM strategy s
JOIN user u ON s.user_id = u.user_id
WHERE s.status = 'published'
ORDER BY s.view_count DESC, s.like_count DESC;

CREATE OR REPLACE VIEW view_itineraryitemdetails AS
SELECT 
  i.item_id, i.itinerary_id, i.day_number, i.item_type, i.scenic_id, i.hotel_id, 
  i.transport_id, i.start_time, i.end_time, i.notes, i.order_number, i.created_at, i.updated_at,
  s.name as scenic_name, s.city as scenic_city, s.address as scenic_address, s.ticket_price,
  h.name as hotel_name, h.city as hotel_city, h.address as hotel_address, h.stars, h.price_range,
  t.transport_type, t.from_city, t.to_city, t.price as transport_price
FROM itineraryitem i
LEFT JOIN scenic s ON i.scenic_id = s.scenic_id
LEFT JOIN hotel h ON i.hotel_id = h.hotel_id
LEFT JOIN transport t ON i.transport_id = t.transport_id;

CREATE OR REPLACE VIEW view_personalizedscenic AS
SELECT 
  up.user_id, s.scenic_id, s.name, s.city, s.address, s.ticket_price, s.images, s.label, s.hot_score
FROM scenic s
JOIN userpreference up ON FIND_IN_SET(SUBSTRING_INDEX(s.label, ',', 1), up.interest)
WHERE s.is_custom = 0;

CREATE OR REPLACE VIEW view_useractivity AS
SELECT 
  u.user_id, u.username,
  COUNT(DISTINCT s.strategy_id) as strategy_count,
  COUNT(DISTINCT b.booking_id) as booking_count,
  COUNT(DISTINCT c.itinerary_id) as itinerary_count,
  (COUNT(DISTINCT s.strategy_id) * 5 + COUNT(DISTINCT b.booking_id) * 3 + COUNT(DISTINCT c.itinerary_id) * 2) as activity_score
FROM user u
LEFT JOIN strategy s ON u.user_id = s.user_id
LEFT JOIN booking b ON u.user_id = b.user_id
LEFT JOIN customizeditinerary c ON u.user_id = c.user_id
GROUP BY u.user_id, u.username;

CREATE OR REPLACE VIEW view_useritineraries AS
SELECT 
  ci.itinerary_id, ci.user_id, ci.title, ci.description, ci.start_date, ci.end_date, 
  ci.city, ci.estimated_budget, ci.is_public, ci.created_at, ci.updated_at,
  COUNT(ii.item_id) as total_items,
  SUM(CASE WHEN ii.scenic_id IS NOT NULL THEN 1 ELSE 0 END) as scenic_count,
  SUM(CASE WHEN ii.hotel_id IS NOT NULL THEN 1 ELSE 0 END) as hotel_count,
  SUM(CASE WHEN ii.transport_id IS NOT NULL THEN 1 ELSE 0 END) as transport_count,
  SUM(CASE WHEN ii.scenic_id IS NULL AND ii.hotel_id IS NULL AND ii.transport_id IS NULL THEN 1 ELSE 0 END) as activity_count
FROM customizeditinerary ci
LEFT JOIN itineraryitem ii ON ci.itinerary_id = ii.itinerary_id
GROUP BY ci.itinerary_id, ci.user_id, ci.title, ci.description, ci.start_date, ci.end_date, 
  ci.city, ci.estimated_budget, ci.is_public, ci.created_at, ci.updated_at;

-- ===================== 示例数据插入 =====================

-- 为了演示，需要先插入一个管理员用户作为外键依赖
INSERT IGNORE INTO user (user_id, username, password, email, role, status) VALUES
(1, 'admin', '$2a$10$NJFZp3lEGNIzQ2DVpQGlCuQ8OlcTJ0zMwcOzgiCy.NUOxvI5zcL5.', 'admin@example.com', 'admin', 'active');

-- --- 景点数据 (scenic) --- (共 31 个)
-- 假设 scenic_id 从 1 开始按顺序分配

-- 路线 1 的景点 (IDs: 1-3)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(1, '故宫博物院', '北京', '北京市东城区景山前街4号', '中国明清两代的皇家宫殿，世界上现存规模最大、保存最为完整的木质结构古建筑之一。', '全年 08:30-17:00 (提前一小时停止入场)', 60.00, '[]', '历史古迹,文化艺术,博物馆', 39.9163000, 116.3972000),
(2, '天安门广场', '北京', '北京市东城区西长安街', '世界上最大的城市广场之一，中国国家象征。', '全天开放 (升降旗时间需查询)', 0.00, '[]', '地标,广场', 39.9087000, 116.3975000),
(3, '天坛公园', '北京', '北京市东城区天坛内东里7号', '明清两代皇帝祭祀皇天、祈五谷丰登的场所。', '公园 06:00-22:00, 景点 08:00-17:00', 15.00, '[]', '历史古迹,公园,世界遗产', 39.8827000, 116.4066000);

-- 路线 2 的景点 (IDs: 4-6)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(4, '莫高窟', '敦煌', '甘肃省酒泉市敦煌市东南25公里处鸣沙山东麓', '世界上现存规模最大、内容最丰富的佛教艺术地。', '旺季 08:00-18:00, 淡季 09:00-17:30', 238.00, '[]', '历史古迹,文化艺术,世界遗产,石窟', 40.0434000, 94.8079000),
(5, '鸣沙山月牙泉', '敦煌', '甘肃省酒泉市敦煌市南郊7公里处', '沙漠奇观，沙山环抱中的一弯清泉。', '全年 05:30-20:30', 110.00, '[]', '自然风光,沙漠,湖泊', 40.0940000, 94.6661000),
(6, '玉门关遗址', '敦煌', '甘肃省酒泉市敦煌市西北约90公里处戈壁滩中', '古丝绸之路上的重要关隘遗址。', '全年 08:00-18:00', 40.00, '[]', '历史古迹,世界遗产,遗址', 40.2958000, 93.8602000);

-- 路线 3 的景点 (IDs: 7-9)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(7, '周庄古镇-双桥', '苏州', '江苏省苏州市昆山市周庄镇', '周庄最具代表性的桥梁，由两桥相连形似钥匙。', '古镇全天开放，景点约 08:00-20:00', 100.00, '[]', '古镇,桥梁,历史建筑', 31.1177000, 120.8473000),
(8, '周庄古镇-沈厅', '苏州', '江苏省苏州市昆山市周庄镇南市街', '明代富商沈万三后裔所建的宅第，规模宏大。', '古镇全天开放，景点约 08:00-20:00', 100.00, '[]', '古镇,历史建筑,名人故居', 31.1165000, 120.8470000),
(9, '周庄古镇-张厅', '苏州', '江苏省苏州市昆山市周庄镇北市街', '典型的明代官宦宅第建筑，"轿从门前进，船自家中过"。', '古镇全天开放，景点约 08:00-20:00', 100.00, '[]', '古镇,历史建筑', 31.1172000, 120.8488000);

-- 路线 4 的景点 (IDs: 10-13)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(10, '布达拉宫', '拉萨', '西藏自治区拉萨市城关区北京中路35号', '世界上海拔最高，集宫殿、城堡和寺院于一体的宏伟建筑。', '全年 09:00-15:00 (需预约)', 200.00, '[]', '历史古迹,宗教场所,世界遗产,宫殿', 29.6575000, 91.1171000),
(11, '大昭寺', '拉萨', '西藏自治区拉萨市城关区八廓西街', '藏传佛教信徒心中的至圣之所。', '全年 07:00-17:30', 85.00, '[]', '宗教场所,历史古迹,世界遗产', 29.6530000, 91.1314000),
(12, '八廓街', '拉萨', '西藏自治区拉萨市城关区大昭寺周围', '围绕大昭寺的转经道和商业中心。', '全天开放', 0.00, '[]', '街道,集市,宗教场所', 29.6536000, 91.1317000),
(13, '色拉寺', '拉萨', '西藏自治区拉萨市城关区色拉乌孜山麓', '藏传佛教格鲁派六大主寺之一，以辩经闻名。', '全年 09:00-16:00 (辩经约15:00开始)', 50.00, '[]', '宗教场所,寺庙', 29.6878000, 91.1333000);

-- 路线 5 的景点 (IDs: 14-16)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(14, '大鹏所城', '深圳', '广东省深圳市龙岗区大鹏街道鹏城社区', '明清两代中国海防的军事要塞，保存较为完整的古城。', '全天开放 (部分内部景点收费)', 0.00, '[]', '历史古迹,古城', 22.5917000, 114.5441000),
(15, '西涌海滩', '深圳', '广东省深圳市龙岗区南澳街道西涌社区', '深圳最长的海滩，沙质细腻，海水清澈。', '全天开放 (旺季可能收费)', 0.00, '[]', '自然风光,海滩', 22.4768000, 114.5267000),
(16, '杨梅坑', '深圳', '广东省深圳市龙岗区南澳街道七娘山脉', '风景优美的沿海小村落，适合骑行和徒步。', '全天开放', 0.00, '[]', '自然风光,乡村,海滨', 22.5735000, 114.5965000);

-- 路线 6 的景点 (IDs: 17-19)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(17, '黄山风景区-迎客松', '黄山', '安徽省黄山市黄山区汤口镇', '黄山标志性景观之一，立于玉屏楼旁。', '景区开放时间约为 06:30-17:30', 190.00, '[]', '自然风光,山岳,世界遗产,名树', 30.1278000, 118.1693000),
(18, '宏村', '黄山', '安徽省黄山市黟县宏村镇', '徽派古村落的代表，有"中国画里的乡村"之称。', '全天开放', 104.00, '[]', '古镇,历史建筑,世界遗产', 29.9043000, 117.9823000),
(19, '西递古村', '黄山', '安徽省黄山市黟县西递镇', '保存完好的明清古村落，徽派建筑艺术的典范。', '全天开放', 104.00, '[]', '古镇,历史建筑,世界遗产', 29.9033000, 117.9356000);

-- 路线 7 的景点 (IDs: 20-22)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(20, '宝塔山', '延安', '陕西省延安市宝塔区', '延安的标志性建筑，革命圣地的象征。', '全年 08:00-18:00', 65.00, '[]', '历史古迹,地标,红色旅游', 36.5938000, 109.4950000),
(21, '枣园革命旧址', '延安', '陕西省延安市宝塔区枣园路', '中共中央书记处所在地，毛泽东等领导人曾在此居住。', '全年 08:00-18:00', 0.00, '[]', '历史古迹,名人故居,红色旅游', 36.6133000, 109.4486000),
(22, '杨家岭革命旧址', '延安', '陕西省延安市宝塔区杨家岭', '中共中央机关所在地，召开了著名的延安文艺座谈会和中共七大。', '全年 08:00-18:00', 0.00, '[]', '历史古迹,红色旅游', 36.6180000, 109.4775000);

-- 路线 8 的景点 (IDs: 23-25)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(23, '丽江古城-四方街', '丽江', '云南省丽江市古城区', '丽江古城的中心广场，是古城的交通枢纽和集贸中心。', '古城全天开放', 0.00, '[]', '古镇,广场,世界遗产', 26.8737000, 100.2243000),
(24, '玉龙雪山-甘海子', '丽江', '云南省丽江市玉龙纳西族自治县', '玉龙雪山东麓的高山草甸，远眺雪山的佳地。', '景区开放时间约 07:00-18:00', 100.00, '[]', '自然风光,雪山,草原', 27.0600000, 100.2200000),
(25, '束河古镇', '丽江', '云南省丽江市古城区束河路', '茶马古道上保存完好的重要集镇，比丽江古城更安静。', '全天开放', 30.00, '[]', '古镇,茶马古道', 26.9188000, 100.2134000);

-- 路线 9 的景点 (IDs: 26-28)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(26, '上海外滩', '上海', '上海市黄浦区中山东一路', '上海的标志性地带，欣赏万国建筑博览群和浦东天际线。', '全天开放', 0.00, '[]', '地标,历史建筑,都市风光', 31.2393000, 121.4912000),
(27, 'M50创意园', '上海', '上海市普陀区莫干山路50号', '由旧工业厂房改造的艺术区，聚集众多画廊和艺术家工作室。', '大部分画廊 10:00-18:00 (周一休息)', 0.00, '[]', '文化艺术,创意园区', 31.2557000, 121.4462000),
(28, '上海博物馆', '上海', '上海市黄浦区人民大道201号', '大型中国古代艺术博物馆，馆藏丰富。', '全年 09:00-17:00 (需预约, 周一闭馆)', 0.00, '[]', '博物馆,文化艺术', 31.2296000, 121.4758000);

-- 路线 10 的景点 (IDs: 29-31)
INSERT IGNORE INTO scenic (scenic_id, name, city, address, description, open_time, ticket_price, images, label, latitude, longitude) VALUES
(29, '沙溪古镇-寺登街', '大理', '云南省大理白族自治州剑川县沙溪镇', '茶马古道上唯一幸存的古集市，保留着原始风貌。', '全天开放', 0.00, '[]', '古镇,茶马古道,历史建筑', 26.3153000, 99.8593000),
(30, '大理古城-南门', '大理', '云南省大理白族自治州大理市', '大理古城的标志性建筑之一，城楼宏伟。', '古城全天开放', 0.00, '[]', '古城,历史建筑', 25.6887000, 100.1643000),
(31, '虎跳峡-上虎跳', '丽江/香格里拉', '云南省丽江市玉龙县与香格里拉市交界处', '长江（金沙江）上最窄的峡谷段，水流湍急，气势磅礴。', '全年 07:30-16:30', 45.00, '[]', '自然风光,峡谷,河流', 27.2176000, 100.1333000);


-- --- 精选路线 (featuredroute) --- (共 10 条)
-- 假设 featured_route_id 从 1 开始按顺序分配

INSERT IGNORE INTO featuredroute (featured_route_id, name, description, category, difficulty, is_active) VALUES
(1, '古都遗韵：历史轴线漫步', '探索古老都城的历史遗迹，感受千年文化沉淀。', '文化', '休闲', 1),
(2, '丝路回响：沙漠绿洲之旅', '重走古丝绸之路，探寻沙漠中的文化明珠与自然奇观。', '历史', '中等', 1),
(3, '江南水乡：古镇风情画', '穿梭于小桥流水人家，体验温婉柔美的江南水乡文化。', '文化', '休闲', 1),
(4, '雪域高原：信仰与秘境', '深入雪域高原，探访神秘的寺庙和壮丽的自然风光。', '文化', '挑战', 1),
(5, '海滨风情：渔村文化探秘', '体验传统渔村生活，品尝海鲜，感受海洋文化。', '文化', '休闲', 1),
(6, '山水墨韵：诗意山水行', '游览如画山水，感受中国传统山水画的意境。', '自然', '中等', 1),
(7, '红色足迹：革命圣地巡礼', '追寻革命先辈的足迹，学习红色历史文化。', '历史', '休闲', 1),
(8, '民族风情：多彩家园访', '走进少数民族村寨，体验独特的民族文化和风俗。', '文化', '中等', 1),
(9, '都市脉络：现代艺术寻踪', '探索现代都市中的艺术空间和文化地标。', '艺术', '休闲', 1),
(10, '茶马古道：马帮文化体验', '沿循古老的茶马古道，了解马帮历史和沿途文化。', '历史', '挑战', 1);


-- --- 路线点 (featuredroutespot) ---
-- 引用上面明确指定的 scenic_id 和 featured_route_id
-- !! 如果前面的 INSERT IGNORE 跳过了某些父记录，这里的 INSERT 会失败 !!

-- 路线 1: 古都遗韵：历史轴线漫步 (featured_route_id = 1, scenic_ids = 1, 2, 3)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(1, 1, 1, 39.9163000, 116.3972000), -- 关联 故宫博物院 (scenic_id=1)
(1, 2, 2, 39.9087000, 116.3975000), -- 关联 天安门广场 (scenic_id=2)
(1, 3, 3, 39.8827000, 116.4066000); -- 关联 天坛公园 (scenic_id=3)

-- 路线 2: 丝路回响：沙漠绿洲之旅 (featured_route_id = 2, scenic_ids = 4, 5, 6)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(2, 4, 1, 40.0434000, 94.8079000),  -- 关联 莫高窟 (scenic_id=4)
(2, 5, 2, 40.0940000, 94.6661000),  -- 关联 鸣沙山月牙泉 (scenic_id=5)
(2, 6, 3, 40.2958000, 93.8602000);  -- 关联 玉门关遗址 (scenic_id=6)

-- 路线 3: 江南水乡：古镇风情画 (featured_route_id = 3, scenic_ids = 7, 8, 9)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(3, 7, 1, 31.1177000, 120.8473000), -- 关联 周庄古镇-双桥 (scenic_id=7)
(3, 8, 2, 31.1165000, 120.8470000), -- 关联 周庄古镇-沈厅 (scenic_id=8)
(3, 9, 3, 31.1172000, 120.8488000); -- 关联 周庄古镇-张厅 (scenic_id=9)

-- 路线 4: 雪域高原：信仰与秘境 (featured_route_id = 4, scenic_ids = 10, 11, 12, 13)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(4, 10, 1, 29.6575000, 91.1171000),  -- 关联 布达拉宫 (scenic_id=10)
(4, 11, 2, 29.6530000, 91.1314000),  -- 关联 大昭寺 (scenic_id=11)
(4, 12, 3, 29.6536000, 91.1317000),  -- 关联 八廓街 (scenic_id=12)
(4, 13, 4, 29.6878000, 91.1333000);  -- 关联 色拉寺 (scenic_id=13)

-- 路线 5: 海滨风情：渔村文化探秘 (featured_route_id = 5, scenic_ids = 14, 15, 16)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(5, 14, 1, 22.5917000, 114.5441000), -- 关联 大鹏所城 (scenic_id=14)
(5, 15, 2, 22.4768000, 114.5267000), -- 关联 西涌海滩 (scenic_id=15)
(5, 16, 3, 22.5735000, 114.5965000); -- 关联 杨梅坑 (scenic_id=16)

-- 路线 6: 山水墨韵：诗意山水行 (featured_route_id = 6, scenic_ids = 17, 18, 19)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(6, 17, 1, 30.1278000, 118.1693000), -- 关联 黄山风景区-迎客松 (scenic_id=17)
(6, 18, 2, 29.9043000, 117.9823000), -- 关联 宏村 (scenic_id=18)
(6, 19, 3, 29.9033000, 117.9356000); -- 关联 西递古村 (scenic_id=19)

-- 路线 7: 红色足迹：革命圣地巡礼 (featured_route_id = 7, scenic_ids = 20, 21, 22)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(7, 20, 1, 36.5938000, 109.4950000), -- 关联 宝塔山 (scenic_id=20)
(7, 21, 2, 36.6133000, 109.4486000), -- 关联 枣园革命旧址 (scenic_id=21)
(7, 22, 3, 36.6180000, 109.4775000); -- 关联 杨家岭革命旧址 (scenic_id=22)

-- 路线 8: 民族风情：多彩家园访 (featured_route_id = 8, scenic_ids = 23, 24, 25)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(8, 23, 1, 26.8737000, 100.2243000), -- 关联 丽江古城-四方街 (scenic_id=23)
(8, 24, 2, 27.0600000, 100.2200000), -- 关联 玉龙雪山-甘海子 (scenic_id=24)
(8, 25, 3, 26.9188000, 100.2134000); -- 关联 束河古镇 (scenic_id=25)

-- 路线 9: 都市脉络：现代艺术寻踪 (featured_route_id = 9, scenic_ids = 26, 27, 28)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(9, 26, 1, 31.2393000, 121.4912000), -- 关联 上海外滩 (scenic_id=26)
(9, 27, 2, 31.2557000, 121.4462000), -- 关联 M50创意园 (scenic_id=27)
(9, 28, 3, 31.2296000, 121.4758000); -- 关联 上海博物馆 (scenic_id=28)

-- 路线 10: 茶马古道：马帮文化体验 (featured_route_id = 10, scenic_ids = 29, 30, 31)
INSERT INTO featuredroutespot (featured_route_id, scenic_id, order_number, latitude, longitude) VALUES
(10, 29, 1, 26.3153000, 99.8593000), -- 关联 沙溪古镇-寺登街 (scenic_id=29)
(10, 30, 2, 25.6887000, 100.1643000), -- 关联 大理古城-南门 (scenic_id=30)
(10, 31, 3, 27.2176000, 100.1333000); -- 关联 虎跳峡-上虎跳 (scenic_id=31)

-- ======================== 脚本结束 ======================== 
