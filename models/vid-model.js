import fs from "fs";
import axios from "axios";
import { JSDOM } from "jsdom";

import CONFIG from "../config/scrape-config.js";
import { randomDelay } from "../config/util.js";
import KCNA from "./kcna-model.js";
import dbModel from "./db-model.js";
import UTIL from "./util-model.js";

/**
 * @class Vid
 * @description Does shit with KCNA Vid (gets them, parses html)
 */
class Vid {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //PARSE VID LIST DATA

  async getVidListArray() {
    const { html } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //throw error if no vid Pages found
    if (!document) {
      const error = new Error("CANT EXTRACT VID PAGE LIST");
      error.url = CONFIG.vidListURL;
      error.function = "getVidListArray (MODEL)";
      throw error;
    }

    // Select all the elements that contain individual video data
    const vidWrapperArray = document.querySelectorAll(".video-wrapper");

    const vidListModel = new Vid({ inputArray: vidWrapperArray });
    const vidListArray = await vidListModel.parseVidPageLinks();

    return vidListArray;
  }

  async parseVidPageLinks() {
    const { inputArray } = this.dataObject;

    const vidListArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const vidListModel = new Vid({ listItem: inputArray[i] });
        const vidListObj = await vidListModel.parseVidListItem();
        if (!vidListObj) return null;

        //push to array
        vidListArray.push(vidListObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }
    return vidListArray;
  }

  async parseVidListItem() {
    const { listItem } = this.dataObject;
    if (!listItem) return null;

    //extract vid link and store it
    const vidLinkElement = listItem.querySelector(".img a");
    const href = vidLinkElement.getAttribute("href");

    //throw error HERE
    if (!href) {
      const error = new Error("CANT FIND VID LINK [VID MODEL]");
      error.url = listItem.textContent;
      error.function = "parseVidListItem";
      throw error;
    }

    //build URL
    const urlConstant = "http://www.kcna.kp";
    const vidPageURL = urlConstant + href;

    //extract thmubnail and store it
    const thumbnailModel = new Vid({ inputItem: listItem });
    const thumbnailURL = await thumbnailModel.getVidThumbnail();

    //parse vidId / dateString
    const kcnaId = +thumbnailURL.substring(thumbnailURL.lastIndexOf("/") + 2, thumbnailURL.lastIndexOf("."));
    const dateString = thumbnailURL.substring(thumbnailURL.indexOf("video/kp/") + 9, thumbnailURL.indexOf("/V"));

    //get date
    const dateModel = new UTIL({ inputItem: listItem });
    const vidDate = await dateModel.parseListDate();
    const dateElement = listItem.querySelector(".publish-time");

    //get title
    const titleElement = listItem.querySelector(".title a");
    const titleRaw = titleElement.textContent.trim();
    const title = titleRaw.replace(dateElement.textContent, "").trim();

    const vidListObj = {
      url: vidPageURL,
      thumbnail: thumbnailURL,
      kcnaId: kcnaId,
      dateString: dateString,
      date: vidDate,
      title: title,
    };

    return vidListObj;
  }

  async getVidThumbnail() {
    const { inputItem } = this.dataObject;

    //get thumbnailURL
    const thumbnailElement = inputItem.querySelector(".img img");
    const thumbSrc = thumbnailElement.getAttribute("src");
    const urlConstant = "http://www.kcna.kp";
    const thumbnailURL = urlConstant + thumbSrc;
    if (!thumbnailURL) return null;

    //store it in picURLs
    try {
      const picModel = new dbModel({ url: thumbnailURL }, CONFIG.picURLs);
      const storeData = await picModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }

    return thumbnailURL;
  }

  //----------------------

  async getVidPageObj() {
    const { inputObj } = this.dataObject;

    //html
    const vidPageModel = new KCNA(inputObj);
    const vidPageHTML = await vidPageModel.getHTML();

    //throw error if cant get html
    if (!vidPageHTML) {
      const error = new Error("FAILED TO GET VIDPAGE HTML");
      error.url = inputObj.url;
      error.function = "getVidPageObj (MODEL)";
      throw error;
    }

    //extract vidURL add to obj
    const vidURLModel = new Vid({ str: vidPageHTML });
    const vidURL = await vidURLModel.getVidURL();

    //add to obj
    const vidPageObj = { ...inputObj };
    vidPageObj.vidURL = vidURL;

    //store obj
    const storeModel = new dbModel(vidPageObj, CONFIG.vidPageContent);
    const storeVidData = await storeModel.storeUniqueURL();
    console.log(storeVidData);

    //return for tracking
    return vidPageObj;
  }

  //extract vid URL as String
  async getVidURL() {
    const { str } = this.dataObject;
    //claude regex that extracts anythng starting with '/siteFiles/video AND ending with .mp4'
    const regex = /'\/siteFiles\/video[^']*?\.mp4'/;
    const match = str.match(regex);
    if (!match) return null;
    const vidStr = match[0].substring(1, match[0].length - 1); //get rid of leading / trailing quotes
    if (!vidStr) return null;

    //build URL
    const urlConstant = "http://www.kcna.kp";
    const vidURL = urlConstant + vidStr;

    //store it in vidURLs
    try {
      const storeModel = new dbModel({ url: vidURL }, CONFIG.vidURLs);
      const storeData = await storeModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }

    return vidURL;
  }

  //------------------------

  //VID DATA SECTION

  async getVidData() {
    const { url } = this.dataObject;
    if (!url) return null;

    const paramModel = new Vid({ vidURL: url });
    const vidParams = await paramModel.getVidParams();
    if (!vidParams) return null;

    // console.log("VID PARAMS");
    // console.log(vidParams);

    const vidObjModel = new Vid({ vidParams: vidParams });
    const vidObj = await vidObjModel.getVidObj();
    if (!vidObj) return null;

    const storeModel = new dbModel(vidObj, CONFIG.vids);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return vidObj;
  }

  async getVidParams() {
    const { vidURL } = this.dataObject;

    const kcnaId = +vidURL.substring(vidURL.length - 11, vidURL.length - 4);

    const dateString = vidURL.substring(vidURL.indexOf("/video/") + "/video/kp/".length, vidURL.indexOf("/VID", vidURL.indexOf("/video/")));

    const vidParams = {
      url: vidURL,
      kcnaId: kcnaId,
      dateString: dateString,
    };

    // console.log("FUCKING VID PARAMS");
    // console.log(vidParams);

    return vidParams;
  }

  async getVidObj() {
    const { vidParams } = this.dataObject;

    const htmlModel = new KCNA(vidParams);
    const headerData = await htmlModel.getMediaHeaders();
    if (!headerData) return null;

    const headerModel = new Vid({ headerData: headerData });
    const headerObj = await headerModel.parseVidHeaders();

    const vidObj = { ...vidParams, ...headerObj };

    // console.log("VID OBJECT");
    // console.log(vidObj);

    return vidObj;
  }

  async parseVidHeaders() {
    const { headerData } = this.dataObject;

    console.log("VID HEADER DATA");
    console.log(headerData);

    const serverData = headerData.server;
    const eTag = headerData.etag;
    const vidEditDate = new Date(headerData["last-modified"]);
    const contentRange = headerData["content-range"];

    //get pic size based on content range
    //STILL NEED TO TEST THIS LOGIC
    let vidSizeBytes;
    if (contentRange) {
      vidSizeBytes = +contentRange?.substring(contentRange?.lastIndexOf("/") + 1, contentRange?.length);
    } else {
      vidSizeBytes = headerData["content-length"];
    }
    const vidSizeMB = +(vidSizeBytes / 1048576).toFixed(2);

    const headerObj = {
      scrapeDate: new Date(),
      serverData: serverData,
      eTag: eTag,
      vidEditDate: vidEditDate,
      vidSizeBytes: vidSizeBytes,
      vidSizeMB: vidSizeMB,
    };

    return headerObj;
  }

  //----------------------

  //DOWNLOAD VID SECTION

  async downloadVidArray() {
    const { inputArray } = this.dataObject;

    if (!inputArray || !inputArray.length) return null;

    const downloadVidDataArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        //add save path to picObj
        const vidObj = inputArray[i];
        const savePath = CONFIG.vidPath + vidObj.kcnaId + ".mp4";
        vidObj.savePath = savePath;
        const vidModel = new Vid({ inputObj: vidObj });

        //download the vid
        const downloadVidObj = await vidModel.downloadVidFS();
        if (!downloadVidObj) continue;

        //STORE HERE
        const storeObj = { ...vidObj, ...downloadVidObj };
        const storeModel = new dbModel(storeObj, CONFIG.vidsDownloaded);
        await storeModel.storeUniqueURL();

        downloadVidDataArray.push(storeObj);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      }
    }

    return downloadVidDataArray;
  }

  //!!!!!!!
  //CLAUDE CLAIMS I CAN REFACTOR, stream is an object
  async downloadVidFS() {
    const { inputObj } = this.dataObject;

    //check if new (not possible in most situations, but adding check to be sure)
    const checkModel = new dbModel(inputObj, CONFIG.vidsDownloaded);
    //throws error if not new (keep out of try block to propogate error)
    await checkModel.urlNewCheck();

    //download vid multi
    const downloadModel = new KCNA({ inputObj: inputObj });
    const downloadVidObj = await downloadModel.getVidMultiThread();

    //if fucked try other vid download
    if (!downloadVidObj) {
      const retryObj = await downloadModel.getVidSimple();
      return retryObj;
    }

    return downloadVidObj;
  }
}

export default Vid;
