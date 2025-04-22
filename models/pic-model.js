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

  async getPicData() {
    const { url } = this.dataObject;
    const picParams = await this.getPicParams(url);

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

    //throws error on fail
    const htmlModel = new KCNA(picParams);
    const res = await htmlModel.getPicHeaders();

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
  async getPicSetListArray() {
    const { inputArray } = this.dataObject;

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
    const dateModel = new UTIL({ dateText: dateText });
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

  async getPicSetObj() {
    const { inputObj } = this.dataObject;
    const picSetObj = { ...inputObj };
    //get HTML
    const htmlModel = new KCNA(picSetObj);
    const picSetPageHTML = await htmlModel.getHTML();

    //add in picArray
    const picSetArray = await this.parsePicSetHTML(picSetPageHTML);
    picSetObj.picArray = picSetArray;

    //store it
    const storePicSetModel = new dbModel(picSetObj, CONFIG.picSetContent);
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
