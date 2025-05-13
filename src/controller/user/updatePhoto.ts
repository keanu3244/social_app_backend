import { NextFunction, Request, Response } from "express";
import config from "../../config/env";
import prisma from "../../lib/prisma/init";
import sharp from "sharp";
import { readFileSync, unlink } from "fs";
import path from "path";
import imageSize from "image-size";
export const updatePhoto = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const photo = req.file;
    const id= req.user.id 
    if (!photo) {
      res.status(400).json({ msg: "No file uploaded" });
      return 
    }

    const ext = path.extname(photo.filename); // e.g. ".jpg" 或 ".gif"
    const base = path.basename(photo.filename, ext); // 文件名不含扩展名
    const srcPath = `./uploads/${photo.filename}`;
    const outFilename = `${base}-sm${ext === ".gif" ? ".gif" : ".jpg"}`;
    const outPath = `./uploads/${outFilename}`;

     const user= await prisma.user.update({
          where: {
            id: id,
          },
          data: {
            imageUri: `/uploads/${outFilename}`,
          },
        });
        console.log('user图片上传完毕',user)
      res.status(200).json({msg: '图片上传成功' });
      return 
  } catch (err) {
    res.status(500).json({ msg: "Upload failed" });
    return ;
  }
};
