/**
 * 创建管理员账户脚本
 * 这个脚本用于创建一个新的管理员账户或将现有用户升级为管理员
 * 
 * 使用方法：
 *   node create-admin.js <username> <email> <password>
 *   或者
 *   node create-admin.js --upgrade <username>
 */

const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('加载环境变量文件出错:', result.error);
    process.exit(1);
}

// 导入数据库连接
const { sequelize, testConnection } = require('../utils/db');
// 正确导入并初始化 User 模型
const UserModelFactory = require('../models/User');
const User = UserModelFactory(sequelize);

// 命令行参数处理
const args = process.argv.slice(2);

// 创建管理员账户
async function createAdmin(username, email, password) {
    try {
        await testConnection();
        
        // 检查用户名是否已存在
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            console.error(`错误: 用户名 "${username}" 已存在。`);
            console.log('提示: 如果要将此用户升级为管理员，请使用: node create-admin.js --upgrade', username);
            process.exit(1);
        }
        
        // 检查邮箱是否已存在
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            console.error(`错误: 邮箱 "${email}" 已被注册。`);
            process.exit(1);
        }
        
        // 创建管理员账户
        const newAdmin = await User.create({
            username,
            email,
            password,
            role: 'admin',
            avatar: `https://placehold.co/150?text=${username}`,
        });
        
        console.log('\n✅ 管理员创建成功!');
        console.log('----------------------------');
        console.log('用户名:', newAdmin.username);
        console.log('邮箱:', newAdmin.email);
        console.log('角色:', newAdmin.role);
        console.log('ID:', newAdmin.user_id);
        console.log('----------------------------');
        console.log('您现在可以使用这个账户登录系统，访问 /admin 路径进入管理后台。');
        
    } catch (error) {
        console.error('创建管理员失败:', error);
    } finally {
        await sequelize.close();
    }
}

// 升级现有用户为管理员
async function upgradeToAdmin(username) {
    try {
        await testConnection();
        
        // 查找用户
        const user = await User.findOne({ where: { username } });
        if (!user) {
            console.error(`错误: 用户名 "${username}" 不存在。`);
            process.exit(1);
        }
        
        // 检查用户是否已经是管理员
        if (user.role === 'admin') {
            console.log(`用户 "${username}" 已经是管理员了。`);
            process.exit(0);
        }
        
        // 升级为管理员
        user.role = 'admin';
        await user.save();
        
        console.log('\n✅ 用户角色升级成功!');
        console.log('----------------------------');
        console.log('用户名:', user.username);
        console.log('邮箱:', user.email);
        console.log('新角色:', user.role);
        console.log('ID:', user.user_id);
        console.log('----------------------------');
        console.log('该用户现在可以访问 /admin 路径进入管理后台。');
        
    } catch (error) {
        console.error('升级用户角色失败:', error);
    } finally {
        await sequelize.close();
    }
}

// 显示使用说明
function showUsage() {
    console.log('\n创建管理员账户脚本');
    console.log('===================');
    console.log('\n使用方法:');
    console.log('  创建新管理员:');
    console.log('    node create-admin.js <username> <email> <password>');
    console.log('\n  升级现有用户为管理员:');
    console.log('    node create-admin.js --upgrade <username>');
    console.log('\n示例:');
    console.log('  node create-admin.js admin admin@example.com Passw0rd!');
    console.log('  node create-admin.js --upgrade john_doe');
    process.exit(1);
}

// 主函数
async function main() {
    console.log('\n🛠 旅游平台管理员账户创建工具');
    console.log('===========================\n');

    if (args.length === 0) {
        showUsage();
    }
    
    // 处理升级现有用户的情况
    if (args[0] === '--upgrade') {
        if (args.length !== 2) {
            console.error('错误: 使用 --upgrade 选项时需要提供用户名参数');
            showUsage();
        }
        
        const username = args[1];
        await upgradeToAdmin(username);
        return;
    }
    
    // 处理创建新管理员的情况
    if (args.length !== 3) {
        console.error('错误: 创建管理员需要提供用户名、邮箱和密码三个参数');
        showUsage();
    }
    
    const [username, email, password] = args;
    
    // 验证参数
    if (!username || username.length < 2) {
        console.error('错误: 用户名必须至少包含2个字符');
        process.exit(1);
    }
    
    if (!email || !email.includes('@')) {
        console.error('错误: 请提供有效的电子邮箱地址');
        process.exit(1);
    }
    
    if (!password || password.length < 6) {
        console.error('错误: 密码必须至少包含6个字符');
        process.exit(1);
    }
    
    await createAdmin(username, email, password);
}

// 执行主函数
main().catch(error => {
    console.error('执行脚本时出错:', error);
    process.exit(1);
}); 