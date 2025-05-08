import axios from "axios";
import fs from "fs";

import CONFIG from "../config/config.js";

import { randomDelay } from "../config/util.js";

/**
 * @class KCNA
 * @description Does shit on KCNA and with KCNA data
 */
class DLHelper {
  constructor(dataObject) {
    this.dataObject = dataObject;
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
    const { completedChunkArray, pendingChunkArray, totalChunks } = this.dataObject;
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
          const downloadObj = { ...this.dataObject };

          downloadObj.chunkIndex = chunk.index;
          downloadObj.start = chunk.start;
          downloadObj.end = chunk.end;

          const downloadModel = new DLHelper(downloadObj);
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
    const { url, vidTempPath, chunkIndex, start, end } = this.dataObject;
    const { vidRetries } = CONFIG;

    for (let retry = 0; retry < vidRetries; retry++) {
      try {
        const res = await axios({
          method: "get",
          url: url,
          responseType: "arraybuffer",
          timeout: 1 * 60 * 1000, //1 minute delay (needed)
          headers: { Range: `bytes=${start}-${end}` },
        });

        // Write chunk to temporary file
        const tempFile = `${vidTempPath}.part${chunkIndex}`;
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
          const delay = await randomDelay(3);
          console.log("Retrying after " + delay + "ms");
          await new Promise((r) => setTimeout(r, delay));
        } else {
          return null;
        }
      }
    }
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
