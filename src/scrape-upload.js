import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";
import dbModel from "../models/db-model.js";

import { newUploadMap } from "../config/map.js";

export const uploadNewTG = async () => {
  const { typeArr } = CONFIG;

  for (let i = 0; i < typeArr.length; i++) {
    const type = typeArr[i];
    await uploadByTypeTG(type);
  }
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
