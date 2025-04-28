const axios = require('axios');

// 从环境变量或配置文件中获取高德Web服务API Key
const AMAP_WEB_KEY = process.env.AMAP_WEB_KEY || 'YOUR_DEFAULT_AMAP_WEB_KEY'; // 替换为你的默认Key或确保环境变量已设置

/**
 * 使用高德地理编码API将地址转换为经纬度坐标。
 * @param {string} address - 需要转换的地址字符串。
 * @returns {Promise<[number, number] | null>} 返回包含 [经度, 纬度] 的数组，如果失败则返回 null。
 */
async function getCoordinatesFromAddress(address) {
    if (!address || typeof address !== 'string' || address.trim() === '') {
        console.warn('[Geocoder] Invalid address provided:', address);
        return null;
    }
    if (AMAP_WEB_KEY === 'YOUR_DEFAULT_AMAP_WEB_KEY') {
        console.error('[Geocoder] AMAP Web Service API Key is not configured. Please set AMAP_WEB_KEY environment variable.');
        return null; // Or throw an error
    }

    const url = 'https://restapi.amap.com/v3/geocode/geo';
    const params = {
        key: AMAP_WEB_KEY,
        address: address.trim(),
        output: 'json'
    };

    try {
        console.log(`[Geocoder] Requesting coordinates for address: "${params.address}"`);
        const response = await axios.get(url, { params });

        if (response.data && response.data.status === '1' && response.data.geocodes && response.data.geocodes.length > 0) {
            const locationString = response.data.geocodes[0].location;
            if (locationString) {
                const [longitude, latitude] = locationString.split(',').map(Number);
                if (!isNaN(longitude) && !isNaN(latitude)) {
                    console.log(`[Geocoder] Coordinates found: [${longitude}, ${latitude}]`);
                    return [longitude, latitude];
                }
            }
        }
        console.warn(`[Geocoder] Failed to geocode address "${params.address}". Status: ${response.data?.status}, Info: ${response.data?.info}, Count: ${response.data?.count}`);
        return null;
    } catch (error) {
        console.error(`[Geocoder] Error during geocoding request for address "${params.address}":`, error.message);
        if (error.response) {
            console.error('[Geocoder] Error Response Data:', error.response.data);
            console.error('[Geocoder] Error Response Status:', error.response.status);
        }
        return null;
    }
}

module.exports = {
    getCoordinatesFromAddress
}; 