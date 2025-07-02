import express from "express";
import { apiSingleRoute, apiStreamRoute } from "../controllers/api.js";

const router = express.Router();

router.post("/nork", apiSingleRoute);

router.post("/norkStream", apiStreamRoute);

export default router;
