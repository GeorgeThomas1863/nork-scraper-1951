import axios from "axios";
import fs from "fs";

import CONFIG from "../config/scrape-config.js";
import KCNA from "./kcna-model.js";

import { randomDelay } from "../config/util.js";

/**
 * @class KCNA
 * @description Does shit on KCNA and with KCNA data
 */
class DLHelper {
  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //HEADER RETRY

  async retryHeaderReq() {
    const inputURL = this.dataObject.url;

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

  //VID RETRY
  async retryVidReq() {
    const { url, savePath, kcnaId } = this.dataObject;

    try {
      // await randomDelay(1);
      const res = await axios({
        method: "get",
        url: url,
        timeout: 15 * 1000, //15 seconds
        responseType: "stream",
      });

      if (!res || !res.data) {
        const error = new Error("FETCH FUCKED");
        error.url = url;
        error.fucntion = "VID REQ BACKUP";
        throw error;
      }

      const writer = fs.createWriteStream(savePath);
      const stream = res.data.pipe(writer);
      const totalSize = parseInt(res.headers["content-length"], 10);
      const mbSize = +(totalSize / 1048576).toFixed(2);
      let downloadedSize = 0;

      const consoleStr = "BACKUP VID DOWNLOAD: " + kcnaId + ".mp4 | SIZE: " + mbSize + "MB";
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

  //-------------------

  //UTIL for multi thread vid download

  async getCompletedVidChunks() {
    const { vidTempPath, totalChunks, vidSizeBytes } = this.dataObject;
    const { vidChunkSize } = CONFIG;

    const completedChunkArray = [];

    for (let i = 0; i < totalChunks; i++) {
      const tempFile = `${vidTempPath}.part${i}`;

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
    const { url, vidTempPath, completedChunkArray, pendingChunkArray, totalChunks } = this.dataObject;
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
            vidTempPath: vidTempPath,
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

  async mergeChunks() {
    const { savePath, vidTempPath, totalChunks } = this.dataObject;

    console.log("Merging chunks...");
    const writeStream = fs.createWriteStream(savePath);

    for (let i = 0; i < totalChunks; i++) {
      const tempFile = `${vidTempPath}.part${i}`;
      const chunkData = fs.readFileSync(tempFile);
      writeStream.write(chunkData);
      fs.unlinkSync(tempFile); // Clean up temp file
    }

    writeStream.end();
    console.log("Merge complete");
  }

  async cleanupTempVidFiles() {
    const { vidTempPath, totalChunks } = this.dataObject;

    for (let i = 0; i < totalChunks; i++) {
      const tempFile = `${vidTempPath}.part${i}`;
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
}

export default DLHelper;
