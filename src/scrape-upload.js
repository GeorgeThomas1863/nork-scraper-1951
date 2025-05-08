import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

import { continueScrape } from "./scrape-status.js";
import { newUploadMap } from "../config/map.js";

export const uploadNewTG = async () => {
  const { typeArr } = CONFIG;

  const uploadDataArray = [];
  for (let i = 0; i < typeArr.length; i++) {
    if (!continueScrape) return null;
    const type = typeArr[i];
    const uploadData = await uploadByTypeTG(type);

    const uploadDataObj = {
      type: type,
      uploadData: uploadData,
    };

    //ADD CHECK HERE FOR STOPPING

    //otherwise add to array
    uploadDataArray.push(uploadDataObj);
  }

  return uploadDataArray;
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
