import { Response, NextFunction } from "express";
import prisma from "../../lib/prisma/init";

export const getUser = async (req: any, res: Response, next: NextFunction) => {
  const { id } = req?.user;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        name: true,
        followers: true,
        userName: true,
        id: true,
        followersCount: true,
        followingCount: true,
        email: true,
        following: true,
        verified: true,
        imageUri: true,
        emailIsVerified: true,
      },
    });
    if (user) {
      const {
        email,
        userName,
        imageUri,
        emailIsVerified,
        name,
        id,
        verified,
        followersCount,
        followingCount,
      } = user;
      // const baseUrl = process.env.IMAGE_BASE_URL || "http://localhost:3000"; // 默认值，可根据需要调整
      // const fullImageUri = imageUri ? `${baseUrl}${imageUri}` : null;
      const fullImageUri = imageUri ? `${imageUri}` : null;
      console.log('返回的图片地址',fullImageUri)
      res.status(200).send({
        data: {
          email,
          userName,
          imageUri,
          emailIsVerified,
          verified,
          name,
          id,
          followersCount: followersCount?.toString(),
          followingCount: followingCount?.toString(),
        },
      });
      return;
    }
    res.status(404).json({ msg: "user doesnot exist" });
  } catch (e) {
    console.log('user error',e);
    next(e);
  }
};