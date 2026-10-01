import { Router } from "express";
import * as service from "../services/commitmentService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    res.status(200).json(await service.listCommitments(req.userId));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.status(200).json(await service.getCommitment(req.userId, req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await service.createCommitment(req.userId, req.body));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    res
      .status(200)
      .json(await service.updateCommitment(req.userId, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const removed = await service.deleteCommitment(req.userId, req.params.id);
    res.status(200).json({ message: "Commitment deleted", commitment: removed });
  } catch (err) {
    next(err);
  }
});

export default router;
