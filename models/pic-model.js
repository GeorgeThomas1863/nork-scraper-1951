import { JSDOM } from "jsdom";
import axios from "axios";

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
   * Builds and returns articlePicObj, extracts params from articlePic input, passes to buildPicObj to lookup pic / get headers
   * @function getItemPicObj
   * @params raw articlePicObj html data
   * @returns finished articlePicObj
   */
  async getPicDataArray() {
    const picArray = this.dataObject;

    const picDataArray = [];
    for (let i = 0; i < picArray.length; i++) {
      try {
        const picItem = picArray[i];

        const picData = await this.getPicData(picItem.url);
        if (!picData) continue;

        picDataArray.push(picData);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return picDataArray;
  }

  async getPicData(picURL) {
    const picParams = await this.getPicParams(picURL);

    const picObj = await this.buildPicObj(picParams);
    if (!picObj) return null;

    //store it
    const storeModel = new dbModel(picObj, CONFIG.pics);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return picObj;
  }

  async getPicParams(picURL) {
    //extract kcnaId
    const kcnaId = +picURL.substring(picURL.length - 11, picURL.length - 4);

    //extract out stupid date string
    const dateString = picURL.substring(picURL.indexOf("/photo/") + "/photo/".length, picURL.indexOf("/PIC", picURL.indexOf("/photo/")));

    const picParams = {
      url: picURL,
      kcnaId: kcnaId,
      dateString: dateString,
    };

    return picParams;
  }

  /**
   * Builds picObj from looking up pic headers (and input)
   * throws ERROR if URL doesnt exist / wrosng, NULL if url NOT pic (to iterate through dateArray)
   * @params requires url, kcnaId, dateString as input params
   * @returns finished picObj
   */
  async buildPicObj(picParams) {
    //call picURL here to avoid confusion
    const { url, kcnaId, dateString } = picParams;

    // const res = await fetch(url);
    // const res = await fetch(url, {
    //   headers: { Range: "bytes=0-1" },
    // });

    const res = await axios.get(url, {
      headers: { Range: "bytes=0-1" },
      timeout: 30000,
    });

    //if URL doesnt exist / return headers throw error
    if (!res || !res.headers) {
      const error = new Error("URL DOESNT EXIST");
      error.url = url;
      error.function = "getPicData KCNA MODEL";
      throw error;
    }

    //get pic headers
    const headerData = res.headers;
    console.log(headerData);
    const dataType = headerData["content-type"];

    //if not pic RETURN NULL [KEY FOR PROPER DATE ARRAY ITERATION]
    if (!dataType || dataType !== "image/jpeg") return null;

    //otherwise get data about pic and add to obj //TEST
    const serverData = headerData.server;
    const eTag = headerData.etag;
    const picEditDate = new Date(headerData["last-modified"]);

    const picObj = {
      url: url,
      kcnaId: kcnaId,
      dateString: dateString,
      scrapeDate: new Date(),
      dataType: dataType,
      serverData: serverData,
      eTag: eTag,
      picEditDate: picEditDate,
    };

    console.log("PIC OBJECT");
    console.log(picObj);

    return picObj;
  }

  //---------------------

  //PARSE DATA

  //PICSET LIST
  async buildPicSetList() {
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
    console.log(storeData);

    return picSetListNormal;
  }

  async parsePhotoWrapperArray(inputArray) {
    const picSetListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const photoWrapper = inputArray[i];
      const picSetListObj = await this.getPicSetListObj(photoWrapper);

      picSetListArray.push(picSetListObj);
    }

    return picSetListArray;
  }

  async getPicSetListObj(inputItem) {
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

    // console.log("PIC SET LIST OBJ");
    // console.log(picSetListObj);
    return picSetListObj;
  }

  //----------------------

  //PIC SET PAGE (page where multiple pics in set are displayed)

  async buildPicSetContent() {
    const downloadArray = this.dataObject;

    const picSetArray = [];
    for (let i = 0; i < downloadArray.length; i++) {
      try {
        const picSetObj = await this.getPicSetObj(downloadArray[i]);

        picSetArray.push(picSetObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    //for tracking
    return picSetArray;
  }

  async getPicSetObj(inputObj) {
    const picSetObj = { ...inputObj };
    //get HTML
    const htmlModel = new KCNA(picSetObj);
    const picSetPageHTML = await htmlModel.getHTML();

    //add in picArray
    const picSetArray = await this.parsePicSetHTML(picSetPageHTML);
    picSetObj.picArray = picSetArray;

    //store it
    const storePicSetModel = new dbModel(picSetObj, CONFIG.picSetsDownloaded);
    const storePicSetData = await storePicSetModel.storeUniqueURL();
    console.log(storePicSetData);

    return picSetObj;
  }

  async parsePicSetHTML(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const picElementArray = document.querySelectorAll(".content img");

    const picSetArray = [];
    for (let i = 0; i < picElementArray.length; i++) {
      try {
        const picURL = await this.getPicURL(picElementArray[i]);
        if (!picURL) continue;

        picSetArray.push(picURL);

        //store url to picDB (so dont have to do again)
        const picDataModel = new dbModel({ url: picURL }, CONFIG.picURLs);
        await picDataModel.storeUniqueURL();
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }
    return picSetArray;
  }

  async getPicURL(picElement) {
    if (!picElement) return null;
    const urlConstant = "http://www.kcna.kp";

    //build picURL
    const imgSrc = picElement.getAttribute("src");
    const picURL = urlConstant + imgSrc;

    return picURL;
  }

  //-----------------------------------
}

export default Pic;
