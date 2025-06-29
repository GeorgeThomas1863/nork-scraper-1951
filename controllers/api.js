import { parseAdminCommand, runScrapeCommand } from "../src/scrape-command.js";

//moved everything to src
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  console.log("!!!!API ROUTE");
  console.log(inputParams);

  //gets scrapeId + message, returns it
  const data = await parseAdminCommand(inputParams);
  res.json(data);

  //RUNS SCRAPE COMMAND
  if (data && data.runScrape) {
    await runScrapeCommand(inputParams);
  }

  return true;
};
