import { Router } from "express";
import * as authService from "../services/authService.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const result = await authService.register(req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const result = await authService.login(req.body || {});
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
