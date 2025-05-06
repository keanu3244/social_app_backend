import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";

// 定义白名单路径
  const whitelist = ["/signup"]; // 可以添加更多路径

export const createHashedPassword = (password: string) => {
  return bcrypt.hash(password, 5);
};

export const compareHashedPassword = (
  password: string,
  hashPassword: string
) => {
  return bcrypt.compare(password, hashPassword);
};

export const createJWT = (user: {
  userName: string;
  id: string;
  verified: boolean;
}) => {
  const token = jwt.sign(
    { email: user.userName, id: user.id, verified: user.verified },

    process.env.SECRET || "",
  );

  return token;
};

export const createEmailJWT = (email: string) => {
  const token = jwt.sign(
    { email },

    process.env.SECRET || "",
    { expiresIn: "1h" }
  );

  return token;
};

export const protect = (req: any, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    res.status(401).json({ msg: "Unauthorized" });
    return 
  }
  const [, token] = bearer.split(" ");

  if (!token) {
    res.status(401).json({ msg: "invalid token" });
    return 
  }
  try {
    const user = jwt.verify(token, process.env.SECRET || "");
    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    console.error(e);
    res.status(401).json({ msg: "invalid token" });
    return 
  }
};

export const blockJWT = async (req: any, res: Response, next: NextFunction) => {
  
  // console.log('req.path:',req.path)
  // // 检查当前请求路径是否在白名单中
  // if (whitelist.includes(req.path)) {
  //   console.log(`Skipping authentication for ${req.path}`);
  //   next(); 
  //   return // 跳过认证
  // }
  const bearer = req.headers.authorization;
  console.log(bearer);
  const tokenFromSession = req.session.token;
  console.log(
    "🚀 ~ file: index.ts:68 ~ blockJWT ~ tokenFromSession:",
    tokenFromSession
  );
  if (!tokenFromSession) {
    res.status(401).json({ msg: "Session Expired" });
    return 
  }
  if (!bearer) {
    res.status(401).json({ msg: "Unauthorized" });
    return 
  }

  const [, token] = bearer.split(" ");

  if (!token) {
    res.status(401).json({ msg: "invalid token" });
    return 
  }
  if (token !== tokenFromSession) {
    res.status(401).json({ msg: "invalid token" });
    return 
  }
  next();
};

export const checkVerified = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { verified } = req.user;
  if (verified) {
    next();
  } else {
    res.status(401).json({ msg: "User not verified" });
    return 
  }
};
