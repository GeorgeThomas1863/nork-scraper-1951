//moved everything to src
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  const data = await parseAdminCommand(inputParams);
  return res.json({ data: data });
};
