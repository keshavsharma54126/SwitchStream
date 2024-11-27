import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export const userMiddleware = (req: any, res: any, next: any) => {

  const token = req.cookies.Authentication
  if (!token) {
    return res.status(400).json({
      message: "unauthorized",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      username: string;
      email: string;
    };
    console.log(decoded)
    req.email= decoded.email;
    next();
  } catch (error) {
    return res.status(400).json({
      message: "unauthorized",
    });
  }
};
