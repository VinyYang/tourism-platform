/**
 * JWT工具模块 - 用于生成和验证JWT令牌
 */

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

/**
 * 生成JWT令牌
 * @param {Object} payload - 令牌中要包含的数据
 * @returns {string} JWT令牌
 */
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

/**
 * 验证JWT令牌
 * @param {string} token - 要验证的JWT令牌
 * @returns {Object|null} 解码后的令牌数据，验证失败则返回null
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken
}; 