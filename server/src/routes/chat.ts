import { Router, Request, Response } from "express";
import { chat } from "../services/chatService";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }
    const response = await chat(message, history);
    res.json({ response });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat service unavailable" });
  }
});

export default router;
