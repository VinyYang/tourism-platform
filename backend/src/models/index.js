'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const process = require('process');
const { sequelize } = require('../config/db'); // 导入共享的 sequelize 实例
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.js')[env]; // 如果有单独的 config 文件
const db = {
    sequelize,
    Sequelize,
    // 这些模型将由下面的动态加载逻辑添加
    // User: UserModel, 
    // CustomizedItinerary: CustomizedItineraryModel,
    // ItineraryItem: ItineraryItemModel,
    // Scenic: ScenicModel,
    // Hotel: HotelModel,
    // Transport: TransportModel,
    // Favorite: FavoriteModel,
    // Review: ReviewModel,
    // Booking: BookingModel,
    // UserPreference: UserPreferenceModel,
    // Flight: FlightModel, 
    // Room: RoomModel, 
    // FeaturedRoute: FeaturedRouteModel,
    // FeaturedRouteSpot: FeaturedRouteSpotModel,
};

// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

console.log('>>> Initializing models from index.js...');

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    // 使用导入的 sequelize 实例初始化模型
    const modelDefinition = require(path.join(__dirname, file));
    const model = modelDefinition(sequelize, Sequelize.DataTypes); 
    db[model.name] = model;
    console.log(`  - Loaded model: ${model.name} from ${file}`);
  });

console.log('>>> Associating models...');
Object.keys(db).forEach(modelName => {
  if (modelName !== 'sequelize' && modelName !== 'Sequelize') {
    if (db[modelName].associate) {
      console.log(`Associating model: ${modelName}`);
      db[modelName].associate(db);
    }
  }
});

db.sequelize = sequelize; // 导出 sequelize 实例
db.Sequelize = Sequelize; // 导出 Sequelize 类本身

console.log('>>> Model initialization and association complete.');

module.exports = db; // 导出包含所有模型和 sequelize 的对象 