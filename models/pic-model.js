import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import KCNA from "./kcna-model.js";
import dbModel from "./db-model.js";
import UTIL from "./util-model.js";

/**
 * @class Pic
 * @description Does shit with KCNA Pics (gets them, stores them, uploads, etc)
 */
class Pic {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //------------

  //GET PIC DATA

  /**
   * Builds picObj from looking up pic headers (and input)
   * throws ERROR if URL doesnt exist / wrong, NULL if url NOT pic (to iterate through dateArray)
   * @params requires url, kcnaId, dateString as input params
   * @returns finished picObj
   */
  async buildPicObj() {
    //call picURL here to avoid confusion
    const { url, kcnaId, dateString } = this.dataObject;

    const res = await fetch(url);

    //if URL doesnt exist / return headers throw error
    if (!res || !res.headers) {
      const error = new Error("URL DOESNT EXIST");
      error.url = url;
      error.function = "getPicData KCNA MODEL";
      throw error;
    }

    //get pic headers
    const headerData = res.headers;
    const dataType = headerData.get("content-type");

    //if not pic RETURN NULL [KEY FOR PROPER DATE ARRAY ITERATION]
    if (!dataType || dataType !== "image/jpeg") return null;

    //otherwise get data about pic and add to obj //TEST
    const picSize = headerData.get("content-length");
    const serverData = headerData.get("server");
    const eTag = headerData.get("etag");
    const picEditDate = new Date(headerData.get("last-modified"));

    const picObj = {
      url: url,
      kcnaId: kcnaId,
      dateString: dateString,
      scrapeDate: new Date(),
      dataType: dataType,
      serverData: serverData,
      eTag: eTag,
      picSize: picSize,
      picEditDate: picEditDate,
    };

    console.log(picObj);

    return picObj;
  }

  /**
   * Builds and returns articlePicObj, extracts params from articlePic input, passes to buildPicObj to lookup pic / get headers
   * @function buildArticlePicObj
   * @params raw articlePicObj html data
   * @returns finished articlePicObj
   */
  async buildArticlePicObj() {
    const imgSrc = this.dataObject;
    if (!imgSrc) return null;

    //extract picURL
    const picURL = "http://www.kcna.kp" + imgSrc;

    //extract kcnaId
    const picPathNum = imgSrc.substring(imgSrc.length - 11, imgSrc.length - 4);
    if (!picPathNum) return null;
    const kcnaId = String(Number(picPathNum));

    //extract out stupid date string
    const dateString = imgSrc.substring(imgSrc.indexOf("/photo/") + "/photo/".length, imgSrc.indexOf("/PIC", imgSrc.indexOf("/photo/")));

    const picParams = {
      url: picURL,
      kcnaId: kcnaId,
      dateString: dateString,
    };

    //build pic OBJ from PIC URL file (checks if new AND stores it)
    const picObjModel = new Pic(picParams);
    const picObj = await picObjModel.buildPicObj();

    return picObj;
  }

  //---------------------

  //PARSE DATA

  //PICSET LIST
  async parsePicSetList() {
    const dom = new JSDOM(this.dataObject);
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
    console.log("STORING PIC SET");
    console.log(storeData);

    return picSetListNormal;
  }

  async parsePhotoWrapperArray(inputArray) {
    const picSetListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const photoWrapper = inputArray[i];
      const picSetListObj = await this.buildPicSetListObj(photoWrapper);

      picSetListArray.push(picSetListObj);
    }

    return picSetListArray;
  }

  async buildPicSetListObj(inputItem) {
    const titleWrapper = inputItem.querySelector(".title a");

    //get PicSetURL
    const href = titleWrapper.getAttribute("href");
    const urlConstant = "http://www.kcna.kp";
    const picSetURL = urlConstant + href;

    // build url const url =

    //get date
    const dateElement = inputItem.querySelector(".publish-time");
    const dateText = dateElement.textContent.trim();
    const dateModel = new UTIL(dateText);
    const picSetDate = await dateModel.parseDateElement();

    //get title
    const titleRaw = titleWrapper.textContent.trim();
    const title = titleRaw.replace(dateElement.textContent, "").trim();

    const picSetListObj = {
      url: picSetURL,
      title: title,
      date: picSetDate,
    };

    console.log("PIC SET LIST OBJ");
    console.log(picSetListObj);
    return picSetListObj;
  }

  //----------------------

  //PIC SET PAGE (page where multiple pics in set are displayed)

  async parsePicSetPage() {
    const downloadArray = this.dataObject;
    for (let i = 0; i < downloadArray.length; i++) {
      try {
        const inputObj = downloadArray[i];
        //get HTML
        const picSetPageHTML = await this.getPicSetPageHTML(inputObj);
        const picObjArray = await this.buildPicSetObj(picSetPageHTML);
        inputObj.picArray = picObjArray;

        const storePicSetModel = new dbModel(inputObj, CONFIG.picSets);
        const storePicSetData = await storePicSetModel.storeUniqueURL();
        console.log(storePicSetData);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }
  }

  async getPicSetPageHTML(picSetItem) {
    const htmlModel = new KCNA(picSetItem);
    const html = await htmlModel.getHTML();
    return html;
  }

  async buildPicSetObj(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const picElementArray = document.querySelectorAll(".content img");

    const picSetArray = [];
    for (i = 0; i < picElementArray.length; i++) {
      try {
        const picObj = await this.parsePicElement(picElementArray[i]);
        if (!picURL) continue;
        picSetArray.push(picObj);

        const storePicModel = new dbModel(picObj, CONFIG.pics);
        const storePicData = await storePicModel.storeUniqueURL();
        console.log(storePicData);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return picSetArray;
  }

  async parsePicElement(picElement) {
    if (!picElement) return null;
    const imgSrc = picElement.getAttribute("src");

    //PROB WONT WORK
    const picModel = new Pic(imgSrc);
    const picObj = await picModel.buildArticlePicObj();

    return picObj;
  }
}

export default Pic;
