import express from "express";

const router = express.Router();

router.post("/admin-submit-route", async (req, res) => {
  const command = req.body;
  console.log("HOLY FUCK BALLS");
  console.log("Received command:", command);

  // Process command logic here

  res.json({ success: true, message: "Command " + command.commandType + " processed" });
});

export default router;
