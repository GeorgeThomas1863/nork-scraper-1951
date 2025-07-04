import express from "express";
import { apiRoute } from "../controllers/api.js";

const router = express.Router();

router.post("/nork", apiRoute);

// router.post("/norkStart", apiStart);

// router.get("/norkUpdate", apiUpdate);

export default router;
