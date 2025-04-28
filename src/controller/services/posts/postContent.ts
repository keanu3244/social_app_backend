import { NextFunction, Request, Response } from "express";
import prisma from "../../../lib/prisma/init";
import validator from "validator";
import ogs from "open-graph-scraper";
import expo from "../../../lib/expo/init";
import { handleNotificationsForPosts } from "../../../modules/handleNotifications/forPosts";

// 定义请求体的类型
interface PostContentBody {
  audioUri?: string;
  audioTitle?: string;
  videoUri?: string;
  videoTitle?: string;
  photoUri?: string[];
  postText?: string;
  videoThumbnail?: string;
  photo?: {
    uri: string;
    height: number;
    width: number;
  };
}

// 扩展 Request 类型，包含 user 属性
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const postContent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.user ?? {};

  if (!id) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const {
    audioUri,
    audioTitle,
    videoUri,
    videoTitle,
    photoUri,
    postText,
    videoThumbnail,
    photo,
  }: PostContentBody = req.body;

  console.log("body🚀", req.body);

  const audioUriUpdated = (): string | undefined => {
    if (audioUri) {
      return audioUri.startsWith("http") ? audioUri : `https://${audioUri}`;
    }
    return undefined;
  };

  const videoUriUpdated = (): string | undefined => {
    if (videoUri) {
      return videoUri.startsWith("http") ? videoUri : `https://${videoUri}`;
    }
    return undefined;
  };

  if (postText && validator.isURL(postText)) {
    try {
      const options = { url: postText };
      const data = await ogs(options);

      if (data.result) {
        const result = data.result;
        const ogImage = result.ogImage?.length ? result.ogImage[0] : undefined;
        const title = result.ogTitle;

        const post = await prisma.post.create({
          data: {
            user: {
              connect: { id },
            },
            postText,
            link: {
              create: {
                imageHeight: ogImage?.height ? Number(ogImage.height) : undefined,
                imageWidth: ogImage?.width ? Number(ogImage.width) : undefined,
                imageUri: ogImage?.url,
                url: postText,
                title,
              },
            },
          },
        });

        await sendNotifications(post, id, res);
      } else if (data.error) {
        console.log("OGS error:", data.error);
        await createPostAndNotify({
          userId: id,
          photoUri,
          audioTitle,
          audioUri: audioUriUpdated(),
          videoUri: videoUriUpdated(),
          videoTitle,
          postText,
          videoThumbnail,
          res,
        });
      }
    } catch (e) {
      console.error("Error in URL processing:", e);
      await createPostAndNotify({
        userId: id,
        photoUri,
        audioTitle,
        audioUri: audioUriUpdated(),
        videoUri: videoUriUpdated(),
        videoTitle,
        postText,
        videoThumbnail,
        res,
      });
    }
  } else {
    try {
      const post = await prisma.post.create({
        data: {
          user: {
            connect: { id },
          },
          photoUri,
          photo:
            photo?.height && photo?.uri && photo?.width
              ? {
                  create: {
                    imageHeight: photo.height,
                    imageUri: photo.uri,
                    imageWidth: photo.width,
                  },
                }
              : undefined,
          audioTitle,
          audioUri: audioUriUpdated(),
          videoUri: videoUriUpdated(),
          videoTitle,
          postText,
          videoThumbnail,
        },
      });

      await sendNotifications(post, id, res);
    } catch (e) {
      next(e);
    }
  }
};

// 提取通知发送逻辑
async function sendNotifications(post: { id: string; postText?: any }, userId: string, res: Response): Promise<void> {
  const signedInUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      userName: true,
      imageUri: true,
      followers: { select: { notificationId: true, id: true } },
    },
  });

  if (signedInUser?.followers) {
    for (const follower of signedInUser.followers) {
      if (follower.notificationId) {
        await expo.sendPushNotificationsAsync([
          {
            to: follower.notificationId,
            sound: "default",
            badge: 1,
            mutableContent: true,
            title: `@${signedInUser.userName}`,
            body: "just posted",
            categoryId: "post",
            data: {
              postId: post.id,
              url: `qui-ojo://posts/${post.id}`,
            },
          },
        ]);
      }
    }

    await handleNotificationsForPosts(
      post.postText ?? "New Media content",
      userId,
      signedInUser.imageUri ?? "",
      signedInUser.followers,
      post.id
    );
  }

  res.json({ msg: "posted" });
}

// 提取创建帖子并发送通知的逻辑
async function createPostAndNotify({
  userId,
  photoUri,
  audioTitle,
  audioUri,
  videoUri,
  videoTitle,
  postText,
  videoThumbnail,
  res,
}: {
  userId: string;
  photoUri?: string[];
  audioTitle?: string;
  audioUri?: string;
  videoUri?: string;
  videoTitle?: string;
  postText?: string;
  videoThumbnail?: string;
  res: Response;
}): Promise<void> {
  const post = await prisma.post.create({
    data: {
      user: {
        connect: { id: userId },
      },
      photoUri,
      audioTitle,
      audioUri,
      videoUri,
      videoTitle,
      postText,
      videoThumbnail,
    },
  });

  await sendNotifications(post, userId, res);
}