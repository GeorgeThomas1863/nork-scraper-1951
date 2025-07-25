import axios from "axios";
import fs from "fs";
// import CONFIG from "../config/config.js";

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

    //random between up to 200 bytes
    const randomBytes = Math.floor(Math.random() * 200);
    const byteText = "bytes=0-" + randomBytes;
    console.log("BYTES:", randomBytes);

    try {
      const res = await axios({
        method: "get",
        url: inputURL,
        headers: { Range: byteText },
        timeout: 30000,
      });

      const headers = res.headers;
      console.log("GOT FUCKING HEADERS");

      return headers;
    } catch (e) {
      console.log("HEADER ERROR for " + inputURL + "; | RESPONSE: ");
      console.log(e.code);
      //on fail try stream
      const retryModel = new KCNA(this.dataObject);
      const retryData = await retryModel.retryStream();
      return retryData;
    }
  }

  //HEADER RETRY 2
  async retryStream() {
    const inputURL = this.dataObject.url;

    try {
      // await randomDelay(3);
      const res = await axios({
        method: "get",
        url: inputURL,
        responseType: "stream",
        timeout: 30000,
      });

      const headers = res.headers;
      console.log("GOT FUCKING HEADERS", headers);

      // Immediately abort the stream to prevent downloading the entire file
      res.data.destroy();

      return headers;
    } catch (e) {
      //if still fucked, check if pic and if so try full thing
      if (inputURL.slice(-4) === ".jpg") {
        const finalTryModel = new KCNA(this.dataObject);
        const res = await finalTryModel.retryFullReq();
        return res;
      }

      //otherwise give up
      return null;
    }
  }

  //full get req for failed headers
  async retryFullReq() {
    const inputURL = this.dataObject.url;

    try {
      await randomDelay(3);
      const res = await axios({
        method: "get",
        url: inputURL,
        timeout: 15000, //only wait 15 sec
      });

      const headers = res.headers;

      return headers;
    } catch (e) {
      console.log("TRIED FULL REQ, STILL FUCKED");
      // console.log(e);
      return null;
    }
  }

  //-------------------

  //GET PIC REQ
  //maybe refactor
  async getPicReq() {
    const { url, savePath, picId } = this.dataObject;
    try {
      const res = await axios({
        method: "get",
        url: url,
        timeout: 120000, //2 minutes
        responseType: "stream",
      });
      if (!res || !res.data) {
        const error = new Error("FETCH FUCKED");
        error.url = url;
        error.fucntion = "GET PIC REQ AXIOS";
        throw error;
      }

      const writer = fs.createWriteStream(savePath);
      const stream = res.data.pipe(writer);
      let downloadedSize = 0;

      res.data.on("data", (chunk) => {
        // Log progress in KB every 100KB
        downloadedSize += chunk.length;
        if (downloadedSize % 102400 < chunk.length) {
          const downloadedKB = Math.floor(downloadedSize / 1024);
          console.log(`Downloaded: ${downloadedKB}KB`);
        }
      });
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      console.log(`DOWNLOAD COMPLETE: ${picId}.jpg | FINAL SIZE: ${Math.round(downloadedSize / 1024)}KB`);
      return { downloadedSize: downloadedSize };
    } catch (e) {
      console.log(url + "; " + e.message + "; F BREAK: " + e.function);
      return null;
    }
  }

  //--------------------------------

  //DOWNLOAD VID SECTION

  //complex multi thread download
  async getVidMultiThread() {
    //get obj data
    const { inputObj } = this.dataObject;
    const { totalChunks, savePath, vidSizeBytes } = inputObj;
    const vidObj = { ...inputObj };

    // console.log("DOWNLOAD VID MULTI THREAD INPUT OBJ");
    // console.log(inputObj);

    try {
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
      const chunksProcessed = await processModel.processVidQueue();
      vidObj.chunksProcessed = chunksProcessed;

      const mergeModel = new DLHelper(vidObj);
      await mergeModel.mergeChunks();

      //check if vid exists delete it if fucked
      if (!fs.existsSync(savePath)) return null;
      const vidSize = fs.statSync(savePath).size;
      if (vidSize * 1.2 < vidSizeBytes) {
        fs.unlinkSync(savePath);
        return null;
      }

      return vidObj;
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
      //return null on failure
      return null;
    }
  }

  //VID RETRY
  // async getVidSimple() {
  //   const { url, savePath, vidId } = this.dataObject;

  //   try {
  //     // await randomDelay(1);
  //     const res = await axios({
  //       method: "get",
  //       url: url,
  //       timeout: 15 * 1000, //15 seconds
  //       responseType: "stream",
  //     });

  //     if (!res || !res.data) {
  //       const error = new Error("FETCH FUCKED");
  //       error.url = url;
  //       error.fucntion = "VID REQ BACKUP";
  //       throw error;
  //     }

  //     const writer = fs.createWriteStream(savePath);
  //     const stream = res.data.pipe(writer);
  //     const totalSize = parseInt(res.headers["content-length"], 10);
  //     const mbSize = +(totalSize / 1048576).toFixed(2);
  //     let downloadedSize = 0;

  //     const consoleStr = "BACKUP VID DOWNLOAD: " + vidId + ".mp4 | SIZE: " + mbSize + "MB";
  //     console.log(consoleStr);

  //     //download shit
  //     res.data.on("data", (chunk) => {
  //       downloadedSize += chunk.length;
  //       if (downloadedSize >= totalSize) {
  //       }
  //     });

  //     await new Promise((resolve, reject) => {
  //       stream.on("finish", resolve);
  //       stream.on("error", reject);
  //     });

  //     const returnObj = {
  //       downloadedSize: downloadedSize,
  //       totalSize: totalSize,
  //     };

  //     return returnObj;
  //   } catch (e) {
  //     console.log(url + "; " + e.message + "; F BREAK: " + e.function);
  //     return null;
  //   }
  // }
}

export default KCNA;
