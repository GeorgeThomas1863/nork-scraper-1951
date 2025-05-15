import { parseAdminCommand, runScrapeCommand } from "../src/scrape-command.js";

//moved everything to src
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //gets scrapeId + message, returns it
  const data = await parseAdminCommand(inputParams);
  res.json(data);

  if (data.runScrape) {
    await runScrapeCommand(inputParams);
  }

  return true;
};
