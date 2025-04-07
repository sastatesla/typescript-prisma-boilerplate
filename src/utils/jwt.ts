import jwt from "jsonwebtoken";
import config from "../configs/config";

export function generateToken(userId: any): string {
  return jwt.sign({ userId }, config.jwt.secret);
}