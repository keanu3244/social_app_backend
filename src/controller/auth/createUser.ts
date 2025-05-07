import { NextFunction, Request, Response } from "express";
import prisma from "../../lib/prisma/init";
import { createHashedPassword } from "../../middleware/auth";

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { name, email, password, userName }: { name: string; email: string; password: string; userName: string } =
    req.body;

  if (!name || !email || !password || !userName) {
    res.status(400).json({ 
      message: "缺少必填字段：姓名、邮箱、密码或用户名" 
    });
    return;
  }

  const formattedUserName = userName.toLowerCase().trim();

  console.log("尝试创建用户，数据：", { name, email, userName: formattedUserName });

  try {
    const existingUserByUsername = await prisma.user.findUnique({
      where: { userName: formattedUserName },
    });
    if (existingUserByUsername) {
      res.status(400).json({ message: "用户名已存在" });
      return;
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      res.status(400).json({ message: "邮箱已存在" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        password: await createHashedPassword(password),
        email,
        userName: formattedUserName,
        verified: false,
        emailIsVerified: false,
        followingCount: BigInt(0),
        followersCount: BigInt(0),
        rePostIDs: [],
        followersIDs: [],
        followingIDs: [],
        chatIDs: [],
      },
    });

    console.log("用户创建成功：", user);
    res.status(201).json({ 
      message: "账户创建成功", 
      user: { id: user.id, userName: user.userName, email: user.email } 
    });
  } catch (e: any) {
    console.error("Prisma 错误：", e);

    if (e.code === "P2002") {
      const target = e.meta?.target;
      if (target?.includes("userName")) {
        res.status(400).json({ message: "用户名已存在" });
      } else if (target?.includes("email")) {
        res.status(400).json({ message: "邮箱已存在" });
      }
    } else if (e.code === "P1001") {
      res.status(503).json({ message: "数据库连接失败" });
    } else {
      res.status(500).json({ message: "服务器内部错误" });
    }
  }
}