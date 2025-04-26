import fs from "fs";
import axios from "axios";
import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import { randomDelay } from "../config/util.js";
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

  //PARSE PIC LIST DATA

  async getPicSetListArray() {
    const { html } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const photoWrapperArray = document.querySelectorAll(".photo-wrapper");

    //throw error if no pic Pages found
    if (!photoWrapperArray || !photoWrapperArray.length) {
      const error = new Error("CANT EXTRACT PICSET LIST");
      error.url = CONFIG.picListURL;
      error.function = "getPicListArray (MODEL)";
      throw error;
    }

    const picSetLinkModel = new Pic({ inputArray: photoWrapperArray });
    const picSetListArray = await picSetLinkModel.parsePicSetLinks();

    return picSetListArray;
  }

  async parsePicSetLinks() {
    const { inputArray } = this.dataObject;

    const picSetListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const picSetModel = new Pic({ listItem: inputArray[i] });
        const picSetListObj = await picSetModel.parsePicSetListItem();
        if (!picSetListObj) return null;

        picSetListArray.push(picSetListObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return picSetListArray;
  }

  async parsePicSetListItem() {
    const { listItem } = this.dataObject;
    if (!listItem) return null;

    //get date
    const dateModel = new UTIL({ inputItem: listItem });
    const picSetDate = await dateModel.parseListDate();
    const dateElement = listItem.querySelector(".publish-time");

    //get title
    const titleWrapper = listItem.querySelector(".title a");
    const titleRaw = titleWrapper.textContent.trim();
    const title = titleRaw.replace(dateElement.textContent, "").trim();

    //get PicSetURL
    const href = titleWrapper.getAttribute("href");

    //throw error if cant extact pic link
    if (!href) {
      const error = new Error("CANT FIND PIC LINK [PIC MODEL]");
      error.url = listItem.textContent;
      error.function = "parsePicSetListItem";
      throw error;
    }

    //build URL
    const urlConstant = "http://www.kcna.kp";
    const picSetURL = urlConstant + href;

    //build picSetListObj
    const picSetListObj = {
      url: picSetURL,
      title: title,
      date: picSetDate,
    };

    return picSetListObj;
  }

  //---------------------------

  //PIC SET PAGE (page where multiple pics in set are displayed)

  async getPicSetObj() {
    const { inputObj } = this.dataObject;

    //get HTML
    const htmlModel = new KCNA(inputObj);
    const picSetPageHTML = await htmlModel.getHTML();

    //throw error if cant get html
    if (!picSetPageHTML) {
      const error = new Error("FAILED TO GET PICSET HTML");
      error.url = inputObj.url;
      error.function = "getPicSetObj (MODEL)";
      throw error;
    }

    //get picSetArray
    const parseModel = new Pic({ html: picSetPageHTML });
    const picSetArray = await parseModel.parsePicSetHTML();

    //add to obj
    const picSetObj = { ...inputObj };
    picSetObj.picArray = picSetArray;

    //store it
    const storePicSetModel = new dbModel(picSetObj, CONFIG.picSetContent);
    const storePicSetData = await storePicSetModel.storeUniqueURL();
    console.log(storePicSetData);

    return picSetObj;
  }

  async parsePicSetHTML() {
    const { html } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const picElementArray = document.querySelectorAll(".content img");
    const parseModel = new Pic({ inputArray: picElementArray });
    const picSetArray = await parseModel.parsePicElementArray();

    return picSetArray;
  }

  async parsePicElementArray() {
    const { inputArray } = this.dataObject;

    const picSetArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const picURLModel = new Pic({ picElement: inputArray[i] });
        const picURL = await picURLModel.parsePicURL();
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

  async parsePicURL() {
    const { picElement } = this.dataObject;
    if (!picElement) return null;

    const imgSrc = picElement.getAttribute("src");

    //build picURL
    const urlConstant = "http://www.kcna.kp";
    const picURL = urlConstant + imgSrc;

    return picURL;
  }

  //------------------------------

  //GET PIC DATA

  async getPicData() {
    const { inputObj } = this.dataObject;

    //get picParams
    const paramModel = new Pic({ picURL: inputObj.url });
    const picParams = await paramModel.getPicParams();
    if (!picParams) return null;

    // console.log("PIC PARAMS");
    // console.log(picParams);

    //build picObj
    const picObjModel = new Pic({ picParams: picParams });
    const picObj = await picObjModel.getPicObj();
    if (!picObj) return null;

    //store it
    const storeModel = new dbModel(picObj, CONFIG.pics);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return picObj;
  }

  async getPicParams() {
    const { picURL } = this.dataObject;
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

  //CAN BREAK UP BELOW / REFACTOR
  /**
   * Builds picObj from looking up pic headers (and input)
   * throws ERROR if URL doesnt exist / wrosng, NULL if url NOT pic (to iterate through dateArray)
   * @params requires url, kcnaId, dateString as input params
   * @returns finished picObj
   */
  async getPicObj() {
    const { picParams } = this.dataObject;

    //throws error on fail
    const htmlModel = new KCNA(picParams);
    const res = await htmlModel.getMediaHeaders();
    if (!res) return null;

    //get pic headers
    const headerData = res.headers;
    console.log(headerData);
    const dataType = headerData["content-type"];

    //if not pic RETURN NULL [KEY FOR PROPER DATE ARRAY ITERATION]
    if (!dataType || dataType !== "image/jpeg") return null;

    const headerModel = new Pic({ headerData: headerData });
    const headerObj = await headerModel.parsePicHeaders();

    //throw error if cant extract pic headers
    if (!headerObj) {
      const error = new Error("CANT EXTRACT PIC HEADERS");
      error.url = picParams.url;
      error.function = "buildPicObj MODEL";
      throw error;
    }

    const picObj = { ...picParams, ...headerObj };

    console.log("PIC OBJECT");
    console.log(picObj);

    return picObj;
  }

  async parsePicHeaders() {
    const { headerData } = this.dataObject;

    console.log("PIC HEADER DATA");
    console.log(headerData);

    //otherwise get data about pic and add to obj //TEST
    const serverData = headerData.server;
    const eTag = headerData.etag;
    const picEditDate = new Date(headerData["last-modified"]);
    const dataType = headerData["content-type"];
    const contentRange = headerData["content-range"];
    const picSizeBytes = +contentRange.substring(contentRange.lastIndexOf("/") + 1, contentRange.length);
    const picSizeMB = +(picSizeBytes / 1048576).toFixed(2);

    const headerObj = {
      scrapeDate: new Date(),
      dataType: dataType,
      serverData: serverData,
      eTag: eTag,
      picEditDate: picEditDate,
      picSizeBytes: picSizeBytes,
      picSizeMB: picSizeMB,
    };

    return headerObj;
  }

  //--------------------

  //DOWNLOAD PIC SECTION

  async downloadPicArray() {
    const { inputArray } = this.dataObject;
    if (!inputArray || !inputArray.length) return null;

    const downloadPicDataArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        //add save path to picObj
        const picObj = inputArray[i];
        const savePath = CONFIG.picPath + picObj.kcnaId + ".jpg";
        picObj.savePath = savePath;
        const picModel = new Pic({ picObj: picObj });

        //download the pic
        const downloadPicData = await picModel.downloadPicFS();
        if (!downloadPicData) continue;

        downloadPicDataArray.push(downloadPicData);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return downloadPicDataArray;
  }

  //!!!!!!!
  //CLAUDE CLAIMS I CAN REFACTOR, stream is an object
  async downloadPicFS() {
    const { picObj } = this.dataObject;
    const { url, savePath } = picObj;

    //check if new (not possible in most situations, but adding check to be sure)
    const checkModel = new dbModel(picObj, CONFIG.picsDownloaded);
    //throws error if not new (keep out of try block to propogate error)
    await checkModel.urlNewCheck();

    try {
      await randomDelay(1);
      const res = await axios({
        method: "get",
        url: url,
        timeout: 120000, //2 minutes
        responseType: "stream",
      });

      if (!res || !res.data) {
        const error = new Error("FETCH FUCKED");
        error.url = url;
        error.fucntion = "GET HTML AXIOS";
        throw error;
      }

      const writer = fs.createWriteStream(savePath);
      const stream = res.data.pipe(writer);
      const totalSize = parseInt(res.headers["content-length"], 10);
      let downloadedSize = 0;

      console.log("DOWNLOADING PIC " + totalSize + "B");
      console.log(totalSize);

      //download shit
      res.data.on("data", (chunk) => {
        downloadedSize += chunk.length;
        if (downloadedSize >= totalSize) {
          // console.log("All data chunks downloaded.");
          // console.log(picURL);
        }
      });

      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      //store downloadedPicData
      const downloadPicObj = { ...picObj };
      downloadPicObj.downloadedSize = downloadedSize;
      downloadPicObj.totalSize = totalSize;
      const storeModel = new dbModel(downloadPicObj, CONFIG.picsDownloaded);
      await storeModel.storeUniqueURL();

      return downloadPicObj;
    } catch (e) {
      console.log(url + "; " + e.message + "; F BREAK: " + e.function);
      return null;
    }
  }
}

export default Pic;
