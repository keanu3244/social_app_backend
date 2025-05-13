import { NextFunction, Request, Response } from "express";
import sharp from "sharp";
import { readFileSync, unlink } from "fs";
import path from "path";
import imageSize from "image-size";

export const profilePhotoUpload = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
   try {
    const photo = req.file;
    if (!photo) {
      res.status(400).json({ msg: "No file uploaded" });
      return 
    } 

    const ext = path.extname(photo.filename); // e.g. ".jpg" 或 ".gif"
    const base = path.basename(photo.filename, ext); // 文件名不含扩展名
    const srcPath = `./uploads/${photo.filename}`;
    const outFilename = `${base}-sm${ext === ".gif" ? ".gif" : ".jpg"}`;
    const outPath = `./uploads/${outFilename}`;

    // 1. 用 sharp 处理并写入本地
    if (ext === ".gif") {
      await sharp(srcPath, { animated: true })
        .gif()
        .resize(300, 300)
        .toFile(outPath);
    } else {
      await sharp(srcPath)
        .jpeg({ quality: 90 })
        .resize(600, 600)
        .toFile(outPath);
    }
    // 2. 删除原始大图
    unlink(srcPath, (err) => {
      if (err) console.error("Failed to delete original file:", err);
    });
    // 3. 获取图片尺寸
    imageSize(outPath, (err, dimensions) => {
      if (err) {
        console.error("Image size error:", err);
        unlink(outPath, (unlinkErr) => {
          if (unlinkErr) console.error("Failed to delete processed file:", unlinkErr);
        });
        res.status(400).json({ msg: "Failed to process image dimensions" });
        return 
      } 

      // 4. 构造响应
      const image = {
        uri: `/uploads/${outFilename}`, // 假设由 express.static("uploads") 服务
        width: dimensions?.width || 0,
        height: dimensions?.height || 0,
      };
      req.file.path =`${req.file.path}-sm`; // 挂载到 req，供后续中间件使用
      return next()
    });
  } catch (err) {
    res.status(500).json({ msg: "Upload failed" });
  }
};
