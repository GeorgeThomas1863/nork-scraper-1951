import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";

/**
 * Gets / checks for new KCNA data, downloads it AND uploads it to TG
 * @function scrapeKCNA
 * @returns array for tracking
 */

export const scrapeNewKCNA = async () => {
  const startScrapeTime = new Date();
  console.log("STARTING NEW KCNA SCRAPE AT " + startScrapeTime);

  const urlData = await scrapeNewURLs();
  console.log(urlData);

  const downloadData = await scrapeNewMedia();
  console.log(downloadData);

  const uploadData = await uploadNewTG();
  console.log(uploadData);

  const endScrapeTime = new Date();
  const scrapeTime = startScrapeTime - endScrapeTime;
  console.log("FINISHED SCRAPE FOR NEW DATA, SCRAPE TOOK " + scrapeTime);

  return;
};
