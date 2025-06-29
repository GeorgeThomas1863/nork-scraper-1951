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
    console.log("AHHHHHHHHHHHHHHHHHHHH");
    console.log(data);
    console.log(inputParams);

    const { commandType } = inputParams;
    const scrapeCommand = scrapeCommandMap[commandType];
    console.log("SCRAPE COMMAND");
    console.log(scrapeCommand);

    if (!scrapeCommand) return null;

    //param only needed for scrapeUrlKCNA (js ignores unneeded param automatically)
    await scrapeCommand(inputParams);
  }

  return true;
};
