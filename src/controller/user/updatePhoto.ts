import { NextFunction, Request, Response } from "express";
import config from "../../config/env";
import prisma from "../../lib/prisma/init";
export const updatePhoto = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  console.log("🚀 ~ file: postPhoto.ts:4 ~ postPhoto ~ req:", req);
  try {
    if (config.stage === "production") {
      const photos = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          imageUri: req.imageUri,
        },
      });
      if (photos) {
        res.status(200).json({ msg: "Successfully Uploaded" });
        return 
      }
      res.status(400).json({ msg: "bad request" });
      return 

    }
    res.status(400).json({ msg: "bad request" });
    return 
  } catch (e) {
    next(e);
  }
};
