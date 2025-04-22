import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import Pic from "../models/pic-model.js";
import dbModel from "../models/db-model.js";
import UTIL from "../models/util-model.js";

//PICSET LIST
export const buildPicSetList = async (html) => {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const photoWrapperArray = document.querySelectorAll(".photo-wrapper");
  if (!photoWrapperArray || !photoWrapperArray.length) return null;

  const picSetModel = new Pic({ inputArray: photoWrapperArray });
  const picSetListArray = await picSetModel.getPicSetListArray();

  //sort the array
  const sortModel = new UTIL({ inputArray: picSetListArray });
  const picSetListSort = await sortModel.sortArrayByDate();

  //add picSetId ID
  const idModel = new UTIL({ inputArray: picSetListSort });
  const picSetListNormal = await idModel.addListId(CONFIG.picSetList, "picSetId");

  const storeDataModel = new dbModel(picSetListNormal, CONFIG.picSetList);
  const storeData = await storeDataModel.storeArray();
  console.log(storeData);

  return picSetListNormal;
};

export const buildPicSetContent = async (inputArray) => {
  const picSetArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const picSetModel = new Pic({ inputObj: inputArray[i] });
      const picSetObj = await picSetModel.getPicSetObj();

      picSetArray.push(picSetObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //for tracking
  return picSetArray;
};

export const getPicDataArray = async (inputArray) => {
  const picDataArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const picObj = inputArray[i];
      const picDataModel = new Pic(picObj);

      const picData = await picDataModel.getPicData();
      if (!picData) continue;

      picDataArray.push(picData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return picDataArray;
};
