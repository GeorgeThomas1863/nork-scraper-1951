import { parseAdminCommand } from "../src/scrape-command.js";
import { scrapeCommandMap } from "../config/map-scrape.js";
import { scrapeState } from "../src/scrape-state.js";

//moved everything to src
export const apiSingleRoute = async (req, res) => {
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

//STREAMING ROUTE TEST
export const apiStreamRoute = async (req, res) => {
  const inputParams = req.body;

  await parseAdminCommand(inputParams);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Send multiple messages
  res.write(JSON.stringify(scrapeState));

  //RUNS SCRAPE COMMAND
  if (scrapeState && scrapeState.runScrape) {
    const { howMuch } = inputParams;

    const scrapeCommand = scrapeCommandMap[howMuch];
    if (!scrapeCommand) return null;

    // Send updates every minute
    const progressInterval = setInterval(() => {
      res.write(JSON.stringify(scrapeState));
    }, 60 * 1000);

    //param only needed for scrapeUrlKCNA (js ignores unneeded param automatically)
    await scrapeCommand(inputParams);

    // Clean up and send final response
    clearInterval(progressInterval);
  }
  res.write(JSON.stringify(scrapeState));

  res.end();
  return true;
};
