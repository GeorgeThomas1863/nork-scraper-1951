export const parseAdminCommand = async (req, res) => {
  const command = req.body;
  console.log("HOLY FUCK BALLS");
  console.log("Received command:", command);

  return res.json({ AHHHHHH: "test123" });
};
