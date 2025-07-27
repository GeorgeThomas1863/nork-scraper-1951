import { JSDOM } from "jsdom";
import fs from "fs";

import CONFIG from "../config/config.js";
import KCNA from "./kcna-model.js";
import TG from "./tg-control-model.js";
import Pic from "./pic-model.js";
import dbModel from "./db-model.js";
import UTIL from "./util-model.js";

import { scrapeState } from "../src/scrape-state.js";

class Vid {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //VID PAGE LIST SECTION

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

    //check HERE if new URL, throw error if not new
    const checkModel = new dbModel({ url: vidPageURL }, CONFIG.vidPageList);
    await checkModel.urlNewCheck();

    //get date
    const dateModel = new UTIL({ inputItem: listItem });
    const vidDate = await dateModel.parseListDate();
    const dateElement = listItem.querySelector(".publish-time");

    //get title
    const titleElement = listItem.querySelector(".title a");
    const titleRaw = titleElement.textContent.trim();
    const title = titleRaw.replace(dateElement.textContent, "").trim();

    //extract thmubnail and store it
    const thumbnailModel = new Vid({ inputItem: listItem, date: vidDate });
    const thumbnailURL = await thumbnailModel.getVidThumbnail();

    const vidListObj = {
      url: vidPageURL,
      thumbnail: thumbnailURL,
      date: vidDate,
      title: title,
      scrapeId: scrapeState.scrapeId,
    };

    return vidListObj;
  }

  async getVidThumbnail() {
    const { inputItem, date } = this.dataObject;

    //get thumbnailURL
    const thumbnailElement = inputItem.querySelector(".img img");
    const thumbSrc = thumbnailElement.getAttribute("src");
    const urlConstant = "http://www.kcna.kp";
    const thumbnailURL = urlConstant + thumbSrc;
    if (!thumbnailURL) return null;

    //store it in picURLs
    try {
      const picModel = new dbModel({ url: thumbnailURL, scrapeId: scrapeState.scrapeId, date: date }, CONFIG.picURLs);
      const storeData = await picModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }

    return thumbnailURL;
  }

  //----------------------

  //VID CONTENT SECTION

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
    const vidURLModel = new Vid({ html: vidPageHTML, date: inputObj.date });
    const vidURL = await vidURLModel.parseVidURL();

    //add to obj
    const vidPageObj = { ...inputObj };
    vidPageObj.vidURL = vidURL;
    vidPageObj.scrapeId = scrapeState.scrapeId;

    //store obj
    const storeModel = new dbModel(vidPageObj, CONFIG.vidPageContent);
    const storeVidData = await storeModel.storeUniqueURL();
    console.log(storeVidData);

    //return for tracking
    return vidPageObj;
  }

  //extract vid URL as String
  async parseVidURL() {
    const { html, date } = this.dataObject;
    const dom = new JSDOM(html);
    const document = dom.window.document;

    //throw error if no vid Pages found
    if (!document) {
      const error = new Error("CANT EXTRACT VID PAGE LIST");
      error.url = CONFIG.vidListURL;
      error.function = "getVidListArray (MODEL)";
      throw error;
    }

    //parse through scripts
    const scriptArray = document.querySelectorAll("script");

    const vidModel = new Vid({ inputArray: scriptArray, date: date });
    const mp4Link = await vidModel.parseVidScripts();

    //if cant find vid link return null
    if (!mp4Link) return null;

    const urlConstant = "http://www.kcna.kp";
    const vidURL = urlConstant + mp4Link;

    // console.log("!!!VID URL");
    // console.log(vidURL);

    //store it in vidURLs
    try {
      const storeModel = new dbModel({ url: vidURL, scrapeId: scrapeState.scrapeId, date: date }, CONFIG.vidURLs);
      const storeData = await storeModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }

    return vidURL;
  }

  async parseVidScripts() {
    const { inputArray } = this.dataObject;

    let mp4Link = null;

    for (const script of inputArray) {
      const content = script.textContent;
      if (content && content.includes("type='video/mp4'")) {
        //regex looking for the vid type mp4
        const match = content.match(/source src='([^']+)' type='video\/mp4'/);
        if (match && match[1]) {
          mp4Link = match[1];
          return mp4Link;
        }
      }
    }

    return mp4Link;
  }

  //------------------------

  //VID DATA SECTION

  async getVidData() {
    const { inputObj } = this.dataObject;
    const { tempPath } = CONFIG;

    //CHECK IF ALREADY HAVE (shouldnt happen, but double check)
    const checkModel = new dbModel(inputObj, CONFIG.vids);
    await checkModel.urlNewCheck();

    //throws error on fail
    const headerModel = new KCNA(inputObj);
    const headerData = await headerModel.getMediaHeaders();
    if (!headerData) return null;

    console.log("VID HEADER DATA!!!!");
    console.log(headerData);

    //parse vid headers here [will prob need to change based on future headers]
    const parseModel = new Vid({ headerData: headerData });
    const headerObj = await parseModel.parseVidHeaders();

    //get vid ID / SCRAPE id HERE / AND a FUCKING NAME HERE
    const vidIdModel = new UTIL({ type: "vids" });
    const vidId = await vidIdModel.getNextId();
    const vidName = `kcna_${vidId}.mp4`;
    headerObj.vidId = vidId;
    headerObj.scrapeId = scrapeState.scrapeId;
    headerObj.vidName = vidName;

    // //add vid temp path
    // const vidTempPath = tempPath + vidName;
    // headerObj.vidTempPath = vidTempPath;

    const vidObj = { ...headerObj, ...inputObj };

    //store to VIDS collection
    const storeModel = new dbModel(vidObj, CONFIG.vids);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return vidObj;
  }

  async parseVidHeaders() {
    const { headerData } = this.dataObject;
    const { vidChunkSize } = CONFIG;

    console.log("VID HEADER DATA");
    console.log(headerData);

    const serverData = headerData.server;
    const eTag = headerData.etag;
    const vidEditDate = new Date(headerData["last-modified"]);
    const contentRange = headerData["content-range"];

    //get pic size based on content range
    let vidSizeBytes;
    if (contentRange) {
      vidSizeBytes = +contentRange?.substring(contentRange?.lastIndexOf("/") + 1, contentRange?.length);
    } else {
      vidSizeBytes = headerData["content-length"];
    }

    //calc and add to obj
    const vidSizeMB = +(vidSizeBytes / 1048576).toFixed(2);
    const totalChunks = Math.ceil(vidSizeBytes / vidChunkSize);

    const headerObj = {
      scrapeDate: new Date(),
      serverData: serverData,
      eTag: eTag,
      vidEditDate: vidEditDate,
      vidSizeBytes: vidSizeBytes,
      vidSizeMB: vidSizeMB,
      totalChunks: totalChunks,
    };

    return headerObj;
  }

  //----------------------

  //DOWNLOAD VID SECTION

  // async downloadVidItem() {
  //   const { inputObj } = this.dataObject;
  //   const vidObj = { ...inputObj };

  //   console.log("DOWNLOADING VIDEO INPUT OBJ");
  //   console.log(vidObj);

  //   //check if new (not possible in most situations, but adding check to be sure)
  //   const checkModel = new dbModel(vidObj, CONFIG.vidsDownloaded);
  //   await checkModel.urlNewCheck(); //throws error if not new (keep out of try block to propogate error)

  //   //download vid multi
  //   const downloadModel = new KCNA({ inputObj: vidObj });
  //   const downloadVidObj = await downloadModel.getVidMultiThread();

  //   return downloadVidObj;
  // }

  //-----------------------------

  //UPLOAD VIDS
  async postVidPageObj() {
    const { inputObj } = this.dataObject;
    const { url, vidURL, thumbnail } = inputObj;

    if (!inputObj) {
      const error = new Error("VID PAGE UPLOAD FUCKED");
      error.url = url;
      error.function = "postVidPageObj";
      throw error;
    }

    //add channel to post to HERE
    inputObj.tgUploadId = CONFIG.tgUploadId;
    inputObj.scrapeId = scrapeState.scrapeId;

    //normalizes obj
    const normalModel = new UTIL({ inputObj: inputObj });
    const normalObj = await normalModel.normalizeInputsTG();

    //get vid obj data (extra data for each vid)
    const lookupParams = {
      keyToLookup: "url",
      itemValue: vidURL,
    };
    const vidObjModel = new dbModel(lookupParams, CONFIG.vidsDownloaded);
    const vidObjData = await vidObjModel.getUniqueItem();

    //build vidPageObj
    const vidPageObj = { ...normalObj, ...vidObjData };

    // console.log("VID PAGE OBJ");
    // console.log(vidPageObj);

    //check if file exists HERE, throw error if it doesnt
    const vidExists = fs.existsSync(vidPageObj.savePath);
    if (!vidExists) {
      const error = new Error("VID NOT YET DOWNLOADED");
      error.url = url;
      error.function = "postVidPageObj";
      throw error;
    }

    //otherwise post title
    const tgModel = new TG({ inputObj: vidPageObj });
    await tgModel.postTitleTG();

    //post thumbnail [WORKS, but looks stupid, can add back in if needed]
    // const thumbnailModel = new Vid({ inputObj: normalObj });
    // await thumbnailModel.postVidThumbnail();

    //post vid
    const postVidData = await tgModel.postVidTG();

    return postVidData;
  }

  async postVidThumbnail() {
    const { inputObj } = this.dataObject;
    const { thumbnail, kcnaId } = inputObj;

    //thumbnail params
    const thumbnailLookupParams = {
      keyToLookup: "url",
      itemValue: thumbnail,
    };

    //get thumbnail data
    const thumbnailLookupModel = new dbModel(thumbnailLookupParams, CONFIG.picsDownloaded);
    const lookupObj = await thumbnailLookupModel.getUniqueItem();
    const thumbnailObj = { ...lookupObj, ...inputObj };

    //check if thumbnail exists, download it if not
    try {
      const picExists = fs.existsSync(thumbnailObj.savePath);
      if (!picExists) {
        //build download pic params
        const picParams = {
          url: thumbnail,
          kcnaId: kcnaId,
          savePath: thumbnailObj.savePath,
          scrapeId: scrapeState.scrapeId,
        };
        const picModel = new Pic({ picObj: picParams });
        await picModel.downloadPicFS();
      }
      //post thumbnail
      const thumnailPostModel = new TG({ inputObj: thumbnailObj });
      await thumnailPostModel.postPicTG();
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
    return true;
  }
}

export default Vid;
