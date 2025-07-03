import express from "express";
import { apiStart, apiUpdate } from "../controllers/api.js";

const router = express.Router();

router.post("/norkStart", apiStart);

router.get("/norkUpdate", apiUpdate);

export default router;
