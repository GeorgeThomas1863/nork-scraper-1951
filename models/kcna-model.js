import axios from "axios";
import fs from "fs";
import CONFIG from "../config/scrape-config.js";

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

  //SIMPLE HEAD REQUEST DOES NOT WORK

  //     const res = await axios({
  //       method: "head",
  //       url: inputURL,
  //     });

  async getMediaHeaders() {
    const inputURL = this.dataObject.url;

    try {
      // const delay = await randomDelay(3);
      // console.log("DELAY");
      // console.log(delay);

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
      const res = await this.getRawHTML(inputURL);
      return res;
    }
  }

  //returns just data, for the pic header fail
  async getRawHTML(inputURL) {
    // const inputURL = this.dataObject.url;

    try {
      await randomDelay(3);
      const res = await axios({
        method: "get",
        url: inputURL,
        timeout: 20000,
        responseType: "text",
      });

      return res;
    } catch (e) {
      console.log("GET FULL DATA REQ (ON HEADERS FAIL) ERROR");
      console.log(e);
      return null;
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
    const { vidSizeBytes } = inputObj;
    const { vidChunkSize } = CONFIG;

    //build vid obj, just to move shit easier
    const vidObj = { ...inputObj };
    const totalChunks = Math.ceil(vidSizeBytes / vidChunkSize);
    vidObj.totalChunks = totalChunks;

    // DONT RUN BC DELETES PARTIALS to use on retries
    // const cleanupModel = new KCNA(vidObj);
    // await cleanupModel.cleanupTempVidFiles();

    //find shit already downloaded
    const completedModel = new KCNA(vidObj);
    const completedChunkArray = await completedModel.getCompletedVidChunks();
    vidObj.completedChunkArray = completedChunkArray;

    if (completedChunkArray.length > 0) {
      console.log("Resuming Chunk " + completedChunkArray.length + "of " + totalChunks + " total chunks");
    }

    //create vid download queue
    const pendingModel = new KCNA(vidObj);
    const pendingChunkArray = await pendingModel.createVidQueue();
    vidObj.pendingChunkArray = pendingChunkArray;

    const processModel = new KCNA(vidObj);
    const processVidData = await processModel.processVidQueue();
    console.log(processVidData);

    const mergeModel = new KCNA(vidObj);
    await mergeModel.mergeChunks();

    return null;
  }

  async getCompletedVidChunks() {
    const { savePath, totalChunks, vidSizeBytes } = this.dataObject;
    const { vidChunkSize } = CONFIG;

    const completedChunkArray = [];

    for (let i = 0; i < totalChunks; i++) {
      const tempFile = `${savePath}.part${i}`;

      if (fs.existsSync(tempFile)) {
        const stats = fs.statSync(tempFile);
        const expectedSize = i < totalChunks - 1 ? vidChunkSize : vidSizeBytes - i * vidChunkSize;

        if (stats.size === expectedSize) {
          completedChunkArray.push(i);
        } else {
          fs.unlinkSync(tempFile); // Remove partial chunks
        }
      }
    }

    return completedChunkArray;
  }

  async createVidQueue() {
    const { completedChunkArray, totalChunks, vidSizeBytes } = this.dataObject;
    const { vidChunkSize } = CONFIG;

    const pendingChunkArray = [];

    for (let i = 0; i < totalChunks; i++) {
      if (!completedChunkArray.includes(i)) {
        const start = i * vidChunkSize;
        const end = Math.min(start + vidChunkSize - 1, vidSizeBytes - 1);
        const pendingObj = {
          index: i,
          start: start,
          end: end,
        };
        pendingChunkArray.push(pendingObj);
      }
    }

    return pendingChunkArray;
  }

  async processVidQueue() {
    const { url, savePath, completedChunkArray, pendingChunkArray, totalChunks } = this.dataObject;
    const { vidConcurrent, vidRetries } = CONFIG;
    const downloadedChunkArray = [...completedChunkArray];
    let remainingChunkArray = [...pendingChunkArray];

    // Process chunks with retry attempts recursively
    for (let i = 0; i < vidRetries; i++) {
      const failedChunkArray = [];

      for (let j = 0; j < remainingChunkArray.length; j += vidConcurrent) {
        const batch = remainingChunkArray.slice(j, j + vidConcurrent);
        const promises = [];

        for (let k = 0; k < batch.length; k++) {
          const chunk = batch[k];
          const downloadObj = {
            url: url,
            savePath: savePath,
            chunkIndex: chunk.index,
            start: chunk.start,
            end: chunk.end,
          };

          const downloadModel = new KCNA(downloadObj);
          const downloadPromise = downloadModel.downloadVidChunk();
          promises.push(downloadPromise);
        }

        const results = await Promise.allSettled(promises);

        //process results
        for (let m = 0; m < results.length; m++) {
          const resultItem = results[m];

          if (resultItem.status === "fulfilled") {
            downloadedChunkArray.push(resultItem.value.chunkIndex);
          } else {
            console.error(`Failed chunk ${batch[m].index}: ${resultItem.reason}`);
            failedChunkArray.push(batch[m]);
          }
        }

        // Show progress
        const progress = ((downloadedChunkArray.length / totalChunks) * 100).toFixed(1);
        console.log(`Overall progress: ${progress}% (${downloadedChunkArray.length}/${totalChunks} chunks)`);
      }

      //update remaining
      remainingChunkArray = failedChunkArray;

      if (remainingChunkArray.length > 0 && i < vidRetries - 1) {
        console.log(`Retry attempt ${i + 1}/${vidRetries}: ${remainingChunkArray.length} chunks remaining`);

        // Add exponential backoff between retry attempts
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i + 1)));
      }
    }

    return downloadedChunkArray;
  }

  async downloadVidChunk() {
    const { url, savePath, chunkIndex, start, end } = this.dataObject;
    const { vidRetries } = CONFIG;

    for (let retry = 0; retry < vidRetries; retry++) {
      try {
        const res = await axios({
          method: "get",
          url: url,
          responseType: "arraybuffer",
          timeout: 1 * 60 * 1000, //1 minute
          headers: { Range: `bytes=${start}-${end}` },
        });

        // Write chunk to temporary file
        const tempFile = `${savePath}.part${chunkIndex}`;
        fs.writeFileSync(tempFile, Buffer.from(res.data));

        console.log(`Chunk ${chunkIndex} downloaded (bytes ${start}-${end})`);

        //obv put into obj
        const returnObj = {
          chunkIndex: chunkIndex,
          tempFile: tempFile,
          start: start,
          end: end,
        };

        return returnObj;
      } catch (e) {
        console.error(`Chunk ${chunkIndex} error: ${e.message}`);

        if (retry < vidRetries - 1) {
          const delay = 1000 * Math.pow(2, retry);
          console.log(`Retry ${retry + 1}/${vidRetries} after ${delay / 1000}s`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw new Error(`Failed to download chunk ${chunkIndex} after ${vidRetries} retries`);
        }
      }
    }
  }

  async mergeChunks() {
    const { savePath, totalChunks } = this.dataObject;

    console.log("Merging chunks...");
    const writeStream = fs.createWriteStream(savePath);

    for (let i = 0; i < totalChunks; i++) {
      const tempFile = `${savePath}.part${i}`;
      const chunkData = fs.readFileSync(tempFile);
      writeStream.write(chunkData);
      fs.unlinkSync(tempFile); // Clean up temp file
    }

    writeStream.end();
    console.log("Merge complete");
  }

  async cleanupTempVidFiles() {
    const { savePath, totalChunks } = this.dataObject;

    for (let i = 0; i < totalChunks; i++) {
      const tempFile = `${savePath}.part${i}`;
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
}

export default KCNA;
