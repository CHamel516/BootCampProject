import { verifyToken } from "../services/authService.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const decoded = verifyToken(match[1]);
    req.userId = decoded.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
