import { parseAdminCommand, runScrapeCommand } from "../src/scrape-command.js";
import { startScheduler } from "../src/scrape-scheduler.js";
import { scrapeState } from "../src/scrape-state.js";

//moved everything to src
// export const apiStart = async (req, res) => {
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //updates the scrapeState
  const data = await parseAdminCommand(inputParams);

  //send back the current updated STATE
  res.json(scrapeState);

  //runs the command sent
  const result = await runScrapeCommand(data);

  res.json(result);

  return result;
};
