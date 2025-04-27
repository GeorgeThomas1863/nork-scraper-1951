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

  async getVidReq() {
    console.log("VID DOWNLOAD!!!");
    console.log(this.dataObject);
    return null;
  }

  // async downloadVidChunk() {
  //   const {} = this.dataObject;

  //   for (let retry = 0; retry < CONFIG.vidRetries; retry++) {
  //     try {
  //       const res = await axios({
  //         method: "get",
  //         url: url,
  //         responseType: "arraybuffer",
  //         timeout: 30000,
  //         headers: { Range: `bytes=${start}-${end}` },
  //       });

  //       // Write chunk to temporary file
  //       const tempFile = `${filePath}.part${chunkIndex}`;
  //       fs.writeFileSync(tempFile, Buffer.from(res.data));

  //       console.log(`Chunk ${chunkIndex} downloaded (bytes ${start}-${end})`);

  //       //obv put into obj
  //       return {
  //         chunkIndex,
  //         tempFile,
  //         start,
  //         end,
  //       };
  //     } catch (error) {
  //       console.error(`Chunk ${chunkIndex} error: ${error.message}`);

  //       if (retry < MAX_RETRIES - 1) {
  //         const delay = 1000 * Math.pow(2, retry);
  //         console.log(`Retry ${retry + 1}/${MAX_RETRIES} after ${delay / 1000}s`);
  //         await new Promise((r) => setTimeout(r, delay));
  //       } else {
  //         throw new Error(`Failed to download chunk ${chunkIndex} after ${MAX_RETRIES} retries`);
  //       }
  //     }
  //   }
  // }

  // async cleanupTempVidFiles() {
  //   const {} = this.dataObject;

  //   for (let i = 0; i < totalChunks; i++) {
  //     const tempFile = `${outputPath}.part${i}`;
  //     if (fs.existsSync(tempFile)) {
  //       fs.unlinkSync(tempFile);
  //     }
  //   }
  // }

  // async findCompletedVidChunks() {
  //   const {} = this.dataObject;

  //   const completedChunks = [];

  //   for (let i = 0; i < totalChunks; i++) {
  //     const tempFile = `${outputPath}.part${i}`;

  //     if (fs.existsSync(tempFile)) {
  //       const stats = fs.statSync(tempFile);
  //       const expectedSize = i < totalChunks - 1 ? CHUNK_SIZE : totalSize - i * CHUNK_SIZE;

  //       if (stats.size === expectedSize) {
  //         completedChunks.push(i);
  //       } else {
  //         fs.unlinkSync(tempFile); // Remove partial chunks
  //       }
  //     }
  //   }

  //   return completedChunks;
  // }

  // async createVidQueue() {
  //   const {} = this.dataObject;

  //   const pendingChunks = [];

  //   for (let i = 0; i < totalChunks; i++) {
  //     if (!completedChunks.includes(i)) {
  //       const start = i * CHUNK_SIZE;
  //       const end = Math.min(start + CHUNK_SIZE - 1, totalSize - 1);
  //       pendingChunks.push({ index: i, start, end });
  //     }
  //   }

  //   return pendingChunks;
  // }

  // async processVidQueue() {
  //   const {} = this.dataObject;

  //   const downloadedChunks = [...completedChunks];

  //   // Process pending chunks in batches
  //   for (let i = 0; i < pendingChunks.length; i += CONCURRENT_DOWNLOADS) {
  //     const batch = pendingChunks.slice(i, i + CONCURRENT_DOWNLOADS);
  //     const promises = batch.map((chunk) => downloadChunk(url, outputPath, chunk.index, chunk.start, chunk.end));

  //     const results = await Promise.allSettled(promises);

  //     // Process results
  //     const failedChunks = [];

  //     for (let j = 0; j < results.length; j++) {
  //       const result = results[j];

  //       if (result.status === "fulfilled") {
  //         downloadedChunks.push(result.value.chunkIndex);
  //       } else {
  //         console.error(`Failed chunk ${batch[j].index}: ${result.reason}`);
  //         failedChunks.push(batch[j]);
  //       }
  //     }

  //     // Add failed chunks back to the queue
  //     pendingChunks.push(...failedChunks);

  //     // Show progress
  //     const progress = ((downloadedChunks.length / totalChunks) * 100).toFixed(1);
  //     console.log(`Overall progress: ${progress}% (${downloadedChunks.length}/${totalChunks} chunks)`);
  //   }

  //   // Process any failed chunks that were added back
  //   if (pendingChunks.length > 0) {
  //     console.log(`Retrying ${pendingChunks.length} failed chunks...`);
  //     await processDownloadQueue(url, outputPath, pendingChunks, downloadedChunks, totalChunks);
  //   }

  //   return downloadedChunks;
  // }

  // async mergeChunks() {
  //   const {} = this.dataObject;

  //   console.log("Merging chunks...");
  //   const writeStream = fs.createWriteStream(outputPath);

  //   for (let i = 0; i < totalChunks; i++) {
  //     const tempFile = `${outputPath}.part${i}`;
  //     const chunkData = fs.readFileSync(tempFile);
  //     writeStream.write(chunkData);
  //     fs.unlinkSync(tempFile); // Clean up temp file
  //   }

  //   writeStream.end();
  //   console.log("Merge complete");
  // }
}

export default KCNA;
