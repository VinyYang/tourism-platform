/**
 * 上传控制器
 * 处理文件上传相关的逻辑
 */

const fs = require('fs');
const path = require('path');

// 确定图片存储路径
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'images');
// 确保目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`上传目录已创建: ${UPLOAD_DIR}`);
}

/**
 * 通用图片上传处理函数
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Next 中间件函数
 */
exports.uploadImage = (req, res, next) => {
    console.log('--- 进入通用图片上传控制器 ---');
    
    // 检查文件类型错误
    if (req.fileFilterError) {
        console.error('文件类型错误:', req.fileFilterError.message);
        return res.status(400).json({ 
            success: false, 
            message: req.fileFilterError.message 
        });
    }
    
    // 检查文件是否成功上传
    if (!req.file) {
        console.error('文件上传失败: 未检测到文件');
        return res.status(400).json({ 
            success: false, 
            message: '没有检测到有效的图片文件或上传出错' 
        });
    }
    
    try {
        console.log('文件对象:', req.file);
        
        // 构建图片的访问路径（相对路径）
        const relativePath = `/uploads/images/${req.file.filename}`;
        
        // 为应对API无法访问的情况，将图片复制到前端图片文件夹（如果前端是单独部署的）
        // 这里仅作记录，实际应在具体项目中根据前后端部署情况调整
        const frontendImageDir = path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', 'images');
        if (fs.existsSync(frontendImageDir)) {
            const imageCopyPath = path.join(frontendImageDir, req.file.filename);
            fs.copyFile(req.file.path, imageCopyPath, (err) => {
                if (err) {
                    console.error('复制文件到前端目录失败:', err);
                    // 不中断响应，只记录错误
                } else {
                    console.log(`文件已复制到前端目录: ${imageCopyPath}`);
                }
            });
        }
        
        // 返回成功响应
        res.status(200).json({
            success: true,
            message: '图片上传成功',
            url: relativePath, // 提供相对路径
            path: relativePath // 兼容某些前端代码的命名
        });
        
        console.log('--- 图片上传控制器成功结束 ---');
    } catch (error) {
        console.error('图片上传处理错误:', error);
        next(error);
    }
}; 