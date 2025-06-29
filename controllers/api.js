import { parseAdminCommand } from "../src/scrape-command.js";
import { scrapeCommandMap } from "../config/map-scrape.js";

//moved everything to src
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  console.log("!!!!API ROUTE");
  console.log(inputParams);

  //returns the scrapeState
  const data = await parseAdminCommand(inputParams);
  res.json(data);

  //RUNS SCRAPE COMMAND
  if (data && data.runScrape) {
    const { commandType } = inputParams;
    const scrapeCommand = scrapeCommandMap[commandType];
    if (!scrapeCommand) return null;

    //param only needed for scrapeUrlKCNA (js ignores unneeded param automatically)
    await scrapeCommand(inputParams);
  }

  return true;
};
