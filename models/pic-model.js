import fs from "fs";
import { JSDOM } from "jsdom";

import CONFIG from "../config/config.js";
import KCNA from "./kcna-model.js";
import TG from "./tg-control-model.js";
import dbModel from "./db-model.js";
import UTIL from "./util-model.js";

import { scrapeState } from "../src/scrape-state.js";

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

    //CHECK IF NEW HERE (throws error if not)
    const checkModel = new dbModel({ url: picSetURL }, CONFIG.picSetList);
    await checkModel.urlNewCheck();

    //build picSetListObj
    const picSetListObj = {
      url: picSetURL,
      title: title,
      date: picSetDate,
      scrapeId: scrapeState.scrapeId,
    };

    return picSetListObj;
  }

  //---------------------------

  //PIC SET PAGE (page where multiple pics in set are displayed)

  async getPicSetObj() {
    const { inputObj } = this.dataObject;
    if (!inputObj) return null;

    //double check if new here, throws error if not
    const checkModel = new dbModel(inputObj, CONFIG.picSetContent);
    await checkModel.urlNewCheck();

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
    const parseModel = new Pic({ html: picSetPageHTML, date: inputObj.date });
    const picSetArray = await parseModel.parsePicSetHTML();

    //add to obj / ADD SCRAPE ID HERE
    const picSetObj = { ...inputObj };
    picSetObj.picArray = picSetArray;
    picSetObj.scrapeId = scrapeState.scrapeId;

    //store it
    const storePicSetModel = new dbModel(picSetObj, CONFIG.picSetContent);
    const storePicSetData = await storePicSetModel.storeUniqueURL();
    console.log(storePicSetData);

    return picSetObj;
  }

  async parsePicSetHTML() {
    const { html, date } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const picElementArray = document.querySelectorAll(".content img");
    const parseModel = new Pic({ inputArray: picElementArray, date: date });
    const picSetArray = await parseModel.parsePicElementArray();

    return picSetArray;
  }

  async parsePicElementArray() {
    const { inputArray, date } = this.dataObject;

    const picSetArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      try {
        const picURLModel = new Pic({ picElement: inputArray[i] });
        const picURL = await picURLModel.parsePicURL();
        if (!picURL) continue;

        picSetArray.push(picURL);

        //store url to picDB (so dont have to do again)
        const picDataModel = new dbModel({ url: picURL, scrapeId: scrapeState.scrapeId, date: date }, CONFIG.picURLs);
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
    const headerObj = { ...inputObj };

    //CHECK IF ALREADY HAVE (shouldnt happen, but double check)
    const checkModel = new dbModel(headerObj, CONFIG.pics);
    await checkModel.urlNewCheck();

    //throws error on fail
    const headerModel = new KCNA(headerObj);
    const headerData = await headerModel.getMediaHeaders();
    if (!headerData) return null;

    console.log("HEADER DATA!!!!");
    console.log(headerData);

    //just add entire object in, no need for complex parsing here
    headerObj.headerData = headerData;

    //add scrape id here
    headerObj.scrapeId = scrapeState.scrapeId;

    //get pic ID
    const picIdModel = new UTIL({ type: "pics" });
    const picId = await picIdModel.getNextId();
    headerObj.picId = picId;

    //store it
    const storeModel = new dbModel(headerObj, CONFIG.pics);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return headerObj;
  }

  //--------------------

  //DOWNLOAD PIC SECTION
  async downloadPicFS() {
    const { picObj } = this.dataObject;
    const { url, savePath } = picObj;

    //!!!!HAVE IT CHECK IF ITS ALREADY SAVED TO FILE PATH (instead of Mongo lookup)
    const picExists = fs.existsSync(savePath);
    if (picExists) {
      const error = new Error("PIC ALREADY DOWNLOADED");
      error.url = url;
      error.function = "downloadPicFS";
      throw error;
    }

    const downloadModel = new KCNA(picObj);
    const returnObj = await downloadModel.getPicReq();
    const downloadPicObj = { ...picObj, ...returnObj };

    //add scrape id
    downloadPicObj.scrapeId = scrapeState.scrapeId;

    //store it
    const storeModel = new dbModel(downloadPicObj, CONFIG.picsDownloaded);
    await storeModel.storeUniqueURL();

    return downloadPicObj;
  }

  //-------------------

  //UPLOAD PIC SET SECTION
  async postPicSetObjTG() {
    const { inputObj } = this.dataObject;
    if (!scrapeState.scrapeActive) return null;

    if (!inputObj) {
      const error = new Error("PIC SET UPLOAD OBJ FUCKED");
      error.url = this.dataObject.url;
      error.function = "postPicSetObjTG";
      throw error;
    }

    //destructures // normalizes obj
    const normalModel = new UTIL({ inputObj: inputObj });
    const picSetObj = await normalModel.normalizeInputsTG();

    //add channel to post to AND scrape ID here
    picSetObj.tgUploadId = CONFIG.tgUploadId;
    picSetObj.scrapeId = scrapeState.scrapeId;

    //post title
    const titleModel = new TG({ inputObj: picSetObj });
    await titleModel.postTitleTG();

    //if no pics in pic Set throw error
    if (!picSetObj.picArray || !picSetObj.picArray.length) {
      const error = new Error("NO PICS IN PIC SET");
      error.url = this.dataObject.url;
      error.function = "postPicSetObjTG";
      throw error;
    }

    //otherwise post pics then content
    const postModel = new Pic({ inputObj: picSetObj });
    const postPicSetArray = await postModel.postPicArrayTG();

    return postPicSetArray;
  }

  async postPicArrayTG() {
    const { inputObj } = this.dataObject;
    const { picArray } = inputObj;

    const postPicDataArray = [];
    for (let i = 0; i < picArray.length; i++) {
      try {
        //stop here if needed
        if (!scrapeState.scrapeActive) return postPicDataArray;

        // get full picObj
        const picURL = picArray[i];

        //get full pic Data (from pic db, combine in with inputObj) //get full pic Data (from pic db, combine in with inputObj)
        const lookupParams = {
          keyToLookup: "url",
          itemValue: picURL,
        };

        const picDataModel = new dbModel(lookupParams, CONFIG.picsDownloaded);
        const picObj = await picDataModel.getUniqueItem();
        if (!picObj) continue;

        console.log("PIC OBJ");
        console.log(picObj);

        // const uploadPicObj = { ...inputObj, ...picObj };

        // const postPicModel = new TG({ inputObj: uploadPicObj });
        // const postPicData = await postPicModel.postPicTG();
        // if (!postPicData) continue;

        // postPicDataArray.push(postPicData);
      } catch (e) {
        console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
        // console.log(e);
      }
    }

    return postPicDataArray;
  }
}

export default Pic;
