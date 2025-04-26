import CONFIG from "../config/scrape-config.js";
import KCNA from "../models/kcna-model.js";

import { newUploadMap } from "../config/map.js";

export const uploadNewTG = async () => {
  const { typeArr } = CONFIG;

  for (let i = 0; i < typeArr.length; i++) {
    try {
      const type = typeArr[i];
      const uploadModel = new KCNA({ type: type });
      const uploadArray = await uploadModel.getUploadArray();

      switch (type) {
        case "articles":
          console.log("UPLOADING " + uploadArray?.length + " NEW ARTICLES");
          const articleData = await uploadNewArticlesTG(uploadArray);
          console.log("UPLOADED " + articleData?.length + " NEW ARTICLES");
          break;

        case "pics":
          console.log("UPLOADING " + uploadArray?.length + " NEW PIC SETS");
          const picData = await uploadNewPicSetsTG(uploadArray);
          console.log("UPLOADED " + picData?.length + " NEW PICS SETS");
          break;

        case "vids":
          console.log("UPLOADING " + uploadArray?.length + " NEW VIDS");
          const vidData = await uploadNewVidsTG(uploadArray);
          console.log("UPLOADED " + vidData?.length + " NEW VIDS");
          break;
      }
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }
};

//UPLOAD SHIT SECTION
export const getUploadArray = async (type) => {
  const newDataParams = await newUploadMap(type);

  const uploadModel = new dbModel(newDataParams, "");
  const uploadArray = await uploadModel.findNewPicsBySize();
  return uploadArray;
};
