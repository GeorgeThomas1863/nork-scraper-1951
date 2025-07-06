import { parseAdminCommand, runScrapeCommand } from "../src/scrape-command.js";
import { startScheduler } from "../src/scrape-scheduler.js";
import { scrapeState } from "../src/scrape-state.js";

//moved everything to src
// export const apiStart = async (req, res) => {
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //updates the scrapeState on parse
  const data = await parseAdminCommand(inputParams);
  
  //send back the current updated STATE
  res.json(scrapeState);

  //start scheduler
  if (data && data.scrapeCommand === "admin-start-scheduler") {
    await startScheduler();
    return true;
  }

  //RUN NEW SCRAPE
  if (data && data.runScrape) {
    await runScrapeCommand(inputParams);
    return true;
  }

  //otherwise return
  return true;
};
