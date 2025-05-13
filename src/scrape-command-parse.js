import { scrapeNewKCNA, scrapeAllKCNA, scrapeUrlKCNA, restartAutoScrape } from "./scrape-control.js";
import { setContinueScrape, scrapeActive, continueScrape, scrapeId } from "./scrape-util.js";

//could refactor to switch
export const parseAdminCommand = async (inputParams) => {
  const { commandType } = inputParams;
  if (!commandType) return null;
  let textStr = "";

  //if stop scrape
  if (commandType === "admin-stop-scrape") {
    await setContinueScrape(false);
    textStr = "STOPPING SCRAPE";
    console.log(textStr);
    return { text: textStr, scrapeId: scrapeId };
  }

  //check if already scraping, return null (prevents double scrapes)
  if (scrapeActive) {
    textStr = "ALREADY SCRAPING FAGGOT";
    console.log(textStr);
    return { text: textStr, scrapeId: scrapeId };
  }

  // reset the stopper
  await setContinueScrape(true);

  //if reset auto
  if (commandType === "admin-reset-auto") {
    const restartData = await restartAutoScrape(inputParams);
    return restartData;
  }

  //handle other entries
  if (commandType !== "admin-start-scrape") return null;

  //otherwise start scrape
  await parseStartCommand(inputParams);

  //prevents scrape thats been stopped from overriding shit
  if (!continueScrape) return { text: "SCRAPE STOPPED", scrapeId: scrapeId };

  textStr = "FINISHED SUCCESSFUL SCRAPE";
  console.log(textStr);

  return { text: textStr, scrapeId: scrapeId };
};

export const parseStartCommand = async (inputParams) => {
  const { howMuch, urlInput } = inputParams;

  if (!howMuch) return null;

  let data = "";
  switch (howMuch) {
    case "admin-scrape-new":
      data = await scrapeNewKCNA();
      break;

    case "admin-scrape-all":
      data = await scrapeAllKCNA();
      break;

    case "admin-scrape-url":
      if (!urlInput) return null;
      data = await scrapeUrlKCNA(urlInput);
      break;
  }

  return data;
};
