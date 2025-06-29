import { parseAdminCommand } from "../src/scrape-command.js";
import { scrapeCommandMap } from "../config/map-scrape.js";

//moved everything to src
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  //returns the scrapeState
  const data = await parseAdminCommand(inputParams);
  console.log("RETURN DATA");
  console.log(data);

  res.json(data);

  //RUNS SCRAPE COMMAND
  if (data && data.runScrape) {
    const { howMuch } = inputParams;

    const scrapeCommand = scrapeCommandMap[howMuch];
    if (!scrapeCommand) return null;

    //param only needed for scrapeUrlKCNA (js ignores unneeded param automatically)
    await scrapeCommand(inputParams);
  }

  return true;
};
