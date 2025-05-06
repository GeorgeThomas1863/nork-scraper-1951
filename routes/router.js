import express from "express";
import { parseAdminCommand } from "../controllers/parse-command.js";

const router = express.Router();

router.post("/nork", parseAdminCommand);

export default router;
