import Log from "../models/log-model.js";
import { scrapeState } from "./scrape-state.js";
import { scrapeNewURLs } from "./scrape-urls.js";
import { scrapeNewMedia } from "./scrape-download.js";
import { uploadNewTG } from "./scrape-upload.js";
import { runCleanFS } from "./clean-fs.js";
import { updateMongo } from "./update-db.js";

export const scrapeNewKCNA = async () => {
  //delete empty / fucked files
  await runCleanFS();

  console.log("SCRAPE STATE");
  console.log(scrapeState);

  //get and store new urls
  await scrapeNewURLs();

  //get new media data AND download it
  await scrapeNewMedia();

  //upload to TG
  await uploadNewTG();

  //update mongo with ALL relevant data [unfuck / check it here]
  await updateMongo();

  //LOG SCRAPE END / show how long it took and write it in readable format
  const endModel = new Log();
  await endModel.logStop();
  console.log("#DONE");

  return true;
};

export const scrapeAllKCNA = async () => {
  if (!scrapeState.scrapeActive) return null;
  console.log("BUILD");
};

export const scrapeUrlKCNA = async (url) => {
  if (!scrapeState.scrapeActive) return null;
  //figure out type based on html of URL
  console.log("build");
};
