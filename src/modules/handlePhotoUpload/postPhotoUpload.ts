import { NextFunction, Request, Response } from "express";
import imageSize from "image-size";
import { readFileSync, unlink } from "fs";
import sharp from "sharp";
import path from "path";

export const postPhotoUpload = async (
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
      req.file.path =`${req.file.path}-sm`; 
      res.status(200).json({ photo:image });
      console.log('上传图片成功！',image)
    });
  } catch (err) {
    console.log("postPhotoUpload错误", err);
    res.status(500).json({ msg: "Upload failed" });
    return next(err);
  }
};