import axios from "axios";
import fs from "fs";
import CONFIG from "../config/scrape-config.js";

import DLHelper from "./download-helper-model.js";

import { randomDelay } from "../config/util.js";

/**
 * @class KCNA
 * @description Does shit on KCNA and with KCNA data
 */
class KCNA {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  /**
   * Gets HTML content from the specified URL (works for any url), returns as text
   * @function getHTML
   * @returns  HTML content as text
   */

  //confirm try catch works
  async getHTML() {
    const inputURL = this.dataObject.url;

    try {
      const res = await axios({
        method: "get",
        url: inputURL,
        timeout: 60000,
        responseType: "text",
      });

      return res.data;
    } catch (e) {
      //AXIOS PRODUCES OWN CUSTOM ERROR
      console.log("GET HTML ERROR");
      console.log("ERROR, for " + inputURL);
      console.log(e);
      return null;
    }
  }

  async getMediaHeaders() {
    const inputURL = this.dataObject.url;

    try {
      const res = await axios({
        method: "get",
        url: inputURL,
        headers: { Range: "bytes=0-100" },
        timeout: 30000,
      });

      return res;
    } catch (e) {
      console.log("GET HEADERS ERROR");
      console.log("ERROR, for " + inputURL + "; | RESPONSE: ");
      console.log(e);
      const retryModel = new DLHelper(this.dataObject);
      const res = await retryModel.retryHeaderReq(inputURL);
      return res;
    }
  }

  //-------------------

  //GET PIC REQ

  //maybe refactor
  async getPicReq() {
    const { url, savePath, kcnaId } = this.dataObject;

    try {
      // await randomDelay(1);
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
      const mbSize = +(totalSize / 1048576).toFixed(2);
      let downloadedSize = 0;

      const consoleStr = "DOWNLOADING PIC: " + kcnaId + ".jpg | SIZE: " + mbSize + "MB";
      console.log(consoleStr);

      //download shit
      res.data.on("data", (chunk) => {
        downloadedSize += chunk.length;
        if (downloadedSize >= totalSize) {
        }
      });

      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      const returnObj = {
        downloadedSize: downloadedSize,
        totalSize: totalSize,
      };

      return returnObj;
    } catch (e) {
      console.log(url + "; " + e.message + "; F BREAK: " + e.function);
      return null;
    }
  }

  //--------------------------------

  //GET VID REQ

  async getVidReq() {
    console.log("VID DOWNLOAD!!!");
    console.log(this.dataObject);

    //get obj data
    const { inputObj } = this.dataObject;
    const { vidSizeBytes, kcnaId } = inputObj;
    const { vidChunkSize, tempPath } = CONFIG;
    const vidObj = { ...inputObj };

    //build temp save path
    const vidTempPath = tempPath + kcnaId + ".mp4";
    vidObj.vidTempPath = vidTempPath;

    //add total chunks
    const totalChunks = Math.ceil(vidSizeBytes / vidChunkSize);
    vidObj.totalChunks = totalChunks;

    //find shit already downloaded
    const completedModel = new DLHelper(vidObj);
    const completedChunkArray = await completedModel.getCompletedVidChunks();
    vidObj.completedChunkArray = completedChunkArray;

    if (completedChunkArray.length > 0) {
      console.log("Resuming Chunk " + completedChunkArray.length + " of " + totalChunks + " total chunks");
    }

    //create vid download queue
    const pendingModel = new DLHelper(vidObj);
    const pendingChunkArray = await pendingModel.createVidQueue();
    vidObj.pendingChunkArray = pendingChunkArray;

    const processModel = new DLHelper(vidObj);
    const processVidData = await processModel.processVidQueue();
    console.log(processVidData);

    const mergeModel = new DLHelper(vidObj);
    await mergeModel.mergeChunks();

    //FIGURE OUT A WAY TO RETRY HERE

    // const backupVidDownloadModel = new DLHelper(this.dataObject);
    //       const backupDownloadData = await backupVidDownloadModel.retryVidReq();
    //       //wipe all temp shit
    //       await backupVidDownloadModel.cleanupTempVidFiles();
    //       if (!backupDownloadData) return null;
    //       return true;

    return null;
  }
}

export default KCNA;
