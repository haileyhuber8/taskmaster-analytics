import { Router, Request, Response } from "express";
import {
  getContestants,
  getContestant,
  getSeasons,
  getSeason,
  getAnalysis,
} from "../services/dataService";

const router = Router();

router.get("/contestants", (_req: Request, res: Response) => {
  res.json(getContestants());
});

router.get("/contestants/:id", (req: Request, res: Response) => {
  const contestant = getContestant(parseInt(req.params.id as string));
  if (!contestant) {
    res.status(404).json({ error: "Contestant not found" });
    return;
  }
  res.json(contestant);
});

router.get("/seasons", (_req: Request, res: Response) => {
  res.json(getSeasons());
});

router.get("/seasons/:num", (req: Request, res: Response) => {
  const season = getSeason(parseInt(req.params.num as string));
  if (!season) {
    res.status(404).json({ error: "Season not found" });
    return;
  }
  res.json(season);
});

router.get("/analysis", (_req: Request, res: Response) => {
  res.json(getAnalysis());
});

export default router;
