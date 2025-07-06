import { parseAdminCommand, runScrapeCommand } from "../src/scrape-command.js";
import { scrapeState } from "../src/scrape-state.js";

export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //updates the scrapeState
  const data = await parseAdminCommand(inputParams);

  //dumb way to prevent intervalId from throwing error
  const returnObj = { ...scrapeState };
  returnObj.intervalId = null;

  //return to displayer
  res.json(returnObj);

  //runs the command sent
  const result = await runScrapeCommand(data);

  return result;
};
