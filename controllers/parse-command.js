import { scrapeNewKCNA, scrapeAllKCNA, scrapeUrlKCNA } from "../src/scrape-control.js";

export const parseAdminCommand = async (req, res) => {
  const inputParams = req.body;
  const { commandType } = inputParams;
  if (!commandType) return null;

  console.log("INPUT PARAMS");
  console.log(inputParams);

  let data = "";
  switch (commandType) {
    case "start-scrape":
      data = await parseStartCommand(inputParams);
      break;

    case "stop-scrape":
      data = await stopSrapeKCNA(inputParams);
      break;

    case "scrape-status":
      data = await getScrapeStatus(inputParams);
      break;

    case "restart-auto":
      data = await restartAutoScrape(inputParams);
      break;
  }

  return res.json({ data: data });
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
export const stopSrapeKCNA = async (inputParams) => {
  const testData = { data: "ALLAHU AKBAR" };
  return testData;
};

//might move
export const getScrapeStatus = async (inputParams) => {};

//might move
export const restartAutoScrape = async (inputParams) => {};
