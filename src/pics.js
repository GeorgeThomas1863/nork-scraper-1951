import { JSDOM } from "jsdom";

//PICSET LIST
export const buildPicSetList = async (html) => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const photoWrapperArray = document.querySelectorAll(".photo-wrapper");
  if (!photoWrapperArray || !photoWrapperArray.length) return null;

  const picSetListArray = await this.parsePhotoWrapperArray(photoWrapperArray);

  //sort the array
  const sortModel = new UTIL(picSetListArray);
  const picSetListSort = await sortModel.sortArrayByDate();

  //add picSetId ID
  const idModel = new UTIL(picSetListSort);
  const picSetListNormal = await idModel.addArticleId(CONFIG.picSets, "picSetId");

  const storeDataModel = new dbModel(picSetListNormal, CONFIG.picSets);
  const storeData = await storeDataModel.storeArray();
  console.log(storeData);

  return picSetListNormal;
};

export const buildPicSetContent = async (inputArray) => {
  const picSetArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const picSetObj = await this.getPicSetObj(inputArray[i]);

      picSetArray.push(picSetObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //for tracking
  return picSetArray;
};

/**
 * Builds and returns articlePicObj, extracts params from articlePic input, passes to buildPicObj to lookup pic / get headers
 * @function getItemPicObj
 * @params raw articlePicObj html data
 * @returns finished articlePicObj
 */
export const getPicDataArray = async (inputArray) => {
  const picDataArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const picItem = inputArray[i];

      const picData = await this.getPicData(picItem.url);
      if (!picData) continue;

      picDataArray.push(picData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return picDataArray;
};
