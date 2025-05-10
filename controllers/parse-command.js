import { scrapeNewKCNA, scrapeAllKCNA, scrapeUrlKCNA } from "../src/scrape-control.js";
import { setContinueScrape, scrapeActive } from "../src/scrape-status.js";

//could refactor back to switch but easier this way
export const parseAdminCommand = async (req, res) => {
  const inputParams = req.body;
  const { commandType } = inputParams;
  if (!commandType) return null;

  //if stop scrape
  if (commandType === "stop-scrape") {
    await setContinueScrape(false);
    return res.json({ data: "SCRAPE STOPPED" });
  }

  //check if already scraping, return null (prevents double scrapes)
  if (scrapeActive) {
    return res.json({ data: "ALREADY SCRAPING FAGGOT" });
  }

  // reset the stopper
  await setContinueScrape(true);

  //if reset auto
  if (commandType === "reset-auto") {
    const restartData = await restartAutoScrape(inputParams);
    return res.json({ data: restartData });
  }

  //handle other entries
  if (commandType !== "start-scrape") return null;

  //otherwise start scrape
  const scrapeData = await parseStartCommand(inputParams);

  return res.json({ data: scrapeData });
};

export const parseStartCommand = async (inputParams) => {
  const { howMuch, urlInput } = inputParams;

  if (!howMuch) return null;

  let data = "";
  switch (howMuch) {
    case "scrape-new":
      data = await scrapeNewKCNA();
      break;

    case "scrape-all":
      data = await scrapeAllKCNA();
      break;

    case "scrape-url":
      if (!urlInput) return null;
      data = await scrapeUrlKCNA(urlInput);
      break;
  }

  return data;
};

//might move
export const restartAutoScrape = async (inputParams) => {
  //if scrape already active return null (prevents double scrapes)
  console.log("BUILD");
};
