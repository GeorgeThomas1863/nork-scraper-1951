import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

// import { continueScrape } from "./scrape-util.js";
import { scrapeState } from "./scrape-state.js";
import { newUploadMap } from "../config/map-scrape.js";
// import { logData } from "./scrape-log.js";

export const uploadNewTG = async () => {
  if (!scrapeState.scrapeActive) return null;
  await uploadMediaArrayTG();
  // await logData(uploadMediaData, scrapeId, "uploadMedia");

  return true;
};

export const uploadMediaArrayTG = async () => {
  const { typeArr } = CONFIG;

  // const uploadDataArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    if (!scrapeState.scrapeActive) return null;
    const type = typeArr[i];
    await uploadByTypeTG(type);
    // const uploadMediaData = await uploadByTypeTG(type);

    // const uploadDataObj = {
    //   type: type,
    //   uploadMediaData: uploadMediaData,
    // };

    // //otherwise add to array
    // uploadDataArray.push(uploadDataObj);
  }

  return true;
};

export const uploadByTypeTG = async (type) => {
  const uploadMapObj = await newUploadMap(type);
  const uploadModel = new dbModel(uploadMapObj.params, "");
  const uploadArray = await uploadModel.findNewURLs();

  if (!uploadArray || !uploadArray.length) {
    console.log("NO NEW " + type.toUpperCase() + " TO UPLOAD");
    return null;
  }

  console.log("UPLOADING " + uploadArray?.length + " " + type.toUpperCase());
  const uploadDataArray = await uploadMapObj.func(uploadArray);
  console.log("UPLOADED " + uploadDataArray?.length + " " + type.toUpperCase());

  return uploadDataArray;
};
