import { parseAdminCommand } from "../src/scrape-command.js";
import { scrapeCommandMap } from "../config/map-scrape.js";
import { scrapeState } from "../src/scrape-state.js";

//moved everything to src
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //updates the scrapeState on parse
  await parseAdminCommand(inputParams);
  console.log("SCRAPE STATE");
  console.log(scrapeState);
  res.json(scrapeState);

  //RUNS SCRAPE COMMAND
  if (scrapeState && scrapeState.runScrape) {
    const { howMuch } = inputParams;

    const scrapeCommand = scrapeCommandMap[howMuch];
    if (!scrapeCommand) return null;

    //param only needed for scrapeUrlKCNA (js ignores unneeded param automatically)
    await scrapeCommand(inputParams);
  }

  return true;
};
