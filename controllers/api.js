import { parseAdminCommand, runScrapeCommand } from "../src/scrape-command.js";
import { scrapeState } from "../src/scrape-state.js";

//moved everything to src
// export const apiStart = async (req, res) => {
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //updates the scrapeState
  const data = await parseAdminCommand(inputParams);

  // console.log("DATA");
  // console.log(data);

  //dumb way of dealing with intervalId obj (gotta be a better way)
  const returnObj = { ...scrapeState };
  returnObj.intervalId = null;

  //return to displayer
  res.json(returnObj);

  //runs the command sent
  const result = await runScrapeCommand(data);

  return result;
};
