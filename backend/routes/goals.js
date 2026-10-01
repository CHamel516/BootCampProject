import { Router } from "express";
import * as service from "../services/goalService.js";
import { planGoal } from "../services/planService.js";

const router = Router();

router.post("/:id/plan", async (req, res, next) => {
  try {
    const result = await planGoal(req.userId, req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    res.status(200).json(await service.listGoals(req.userId));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.status(200).json(await service.getGoal(req.userId, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await service.createGoal(req.userId, req.body));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    res
      .status(200)
      .json(await service.updateGoal(req.userId, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await service.deleteGoal(req.userId, req.params.id);
    res.status(200).json({ message: "Goal and its tasks deleted", goal: removed });
  } catch (err) {
    next(err);
  }
});

export default router;
