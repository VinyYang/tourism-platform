const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// 确定上传目录的绝对路径
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'images');

// 启动时检查并创建目录（如果不存在）
try {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        console.log(`上传目录已创建: ${UPLOAD_DIR}`);
    } else {
        console.log(`上传目录已存在: ${UPLOAD_DIR}`);
    }
} catch (err) {
    console.error(`创建上传目录失败: ${UPLOAD_DIR}`, err);
    process.exit(1); // 无法创建目录是严重问题
}

// 配置磁盘存储引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 再次确认目录存在性
        if (!fs.existsSync(UPLOAD_DIR)) {
            // 如果目录在运行时被意外删除，则返回错误
            return cb(new Error(`上传目录不存在: ${UPLOAD_DIR}`), null);
        }
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const originalBaseName = path.basename(file.originalname, path.extname(file.originalname))
                                   .replace(/[^a-zA-Z0-9_\\-\\.]/g, '_');
        const uniqueSuffix = uuidv4();
        const extension = path.extname(file.originalname).toLowerCase();
        const newFilename = `${originalBaseName}-${uniqueSuffix}${extension}`;
        cb(null, newFilename);
    }
});

// 文件类型过滤函数
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimeTypeMatch = allowedTypes.test(file.mimetype);
    const extNameMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeTypeMatch && extNameMatch) {
        cb(null, true);
    } else {
        // 将错误附加到 req，而不是传递给 multer 的 error 参数
        req.fileFilterError = new Error('无效的文件类型，仅支持 JPEG, PNG, GIF, WEBP 图片!');
        cb(null, false); // 拒绝文件
    }
};

// 创建并导出 multer 实例
const uploadMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

module.exports = uploadMiddleware;
