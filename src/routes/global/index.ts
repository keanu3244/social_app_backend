import { Router, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const router = Router();
const rootDir = path.resolve(__dirname, "../../../");

router.get("/", (req: Request, res: Response): void => {
  res.status(200).json({
    msg: "server is up",
  });
});

router.get("/pic/:id", (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  const { d } = req.query;

  const filePath = path.join(rootDir, "/Uploads/", `${id}`);
  const defaultFilePath = path.join(rootDir, "/Uploads/", `nopic.png`);

  if (fs.existsSync(filePath)) {
    if (d) {
      res.download(filePath);
    } else {
      res.sendFile(filePath);
    }
  } else {
    res.sendFile(defaultFilePath);
  }
});

router.get("/video/:id", (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  const filePath = path.join(rootDir, "/Uploads/", `${id}`);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(200).json(null);
  }
});

router.get("/audio/:id", (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  const filePath = path.join(rootDir, "/Uploads/", `${id}`);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(200).json(null);
  }
});

export default router;