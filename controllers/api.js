import { parseAdminCommand, runScrapeCommand } from "../src/scrape-command.js";

// import { scrapeCommandMap } from "../config/map-scrape.js";
import { startScheduler } from "../src/scrape-scheduler.js";

//moved everything to src
// export const apiStart = async (req, res) => {
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //updates the scrapeState on parse
  const data = await parseAdminCommand(inputParams);
  res.json(data);

  //start scheduler
  if (data && data.scrapeCommand === "admin-start-scheduler") {
    await startScheduler();
    return true;
  }

  //RUN NEW SCRAPE
  if (data && data.runScrape) {
    await runScrapeCommand(inputParams);
    return true;
    // const { howMuch } = inputParams;

    // // const scrapeCommand = scrapeCommandMap[howMuch];
    // if (!scrapeCommand) return null;

    // //param only needed for scrapeUrlKCNA (js ignores unneeded param automatically)
    // await scrapeCommand(inputParams);
  }

  //otherwise return
  return true;
};
