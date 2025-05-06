import { scrapeNewKCNA, scrapeAllKCNA, scrapeUrlKCNA } from "../src/scrape-control.js";

export const parseAdminCommand = async (req, res) => {
  const inputParams = req.body;
  const { commandType } = inputParams;
  if (!commandType) return null;

  let data = "";
  switch (commandType) {
    case startScrape:
      data = await parseStartCommand(inputParams);
      break;

    case stopScrape:
      data = await stopSrapeKCNA(inputParams);
      break;

    case scrapeStatus:
      data = await getScrapeStatus(inputParams);
      break;

    case restartAuto:
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
    case scrapeNew:
      data = await scrapeNewKCNA();
      break;

    case scrapeAll:
      data = await scrapeAllKCNA();
      break;

    case scrapeURL:
      if (!urlInput) return null;
      data = await scrapeUrlKCNA(urlInput);
      break;
  }

  return data;
};

//might move
export const stopSrapeKCNA = async (inputParams) => {
  const testData = { data: "ALLAHU AKBAR" };
};

//might move
export const getScrapeStatus = async (inputParams) => {};

//might move
export const restartAutoScrape = async (inputParams) => {};
