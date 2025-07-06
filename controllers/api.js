import { parseAdminCommand } from "../src/scrape-command.js";
import { scrapeCommandMap } from "../config/map-scrape.js";

//moved everything to src
// export const apiStart = async (req, res) => {
export const apiRoute = async (req, res) => {
  const inputParams = req.body;

  // console.log("API START");
  // console.log(inputParams);

  //updates the scrapeState on parse
  const data = await parseAdminCommand(inputParams);
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
