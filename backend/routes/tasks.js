import { Router } from "express";
import * as service from "../services/taskService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.status(200).json(await service.listTasks(req.userId, req.query));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.status(200).json(await service.getTask(req.userId, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await service.createTask(req.userId, req.body));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    res
      .status(200)
      .json(await service.updateTask(req.userId, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await service.deleteTask(req.userId, req.params.id);
    res.status(200).json({ message: "Task deleted", task: removed });
  } catch (err) {
    next(err);
  }
});

export default router;
