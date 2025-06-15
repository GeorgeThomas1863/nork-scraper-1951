import { promises as fs } from "fs";
import path from "path";
import CONFIG from "../config/config.js";
import dbModel from "../models/db-model.js";

export const runCleanFS = async () => {
  //delete BLANK FILES
  await deleteEmptyFilesFS();

  //DELETE TOO MANY FILES (more than X in folder)
};

export const deleteEmptyFilesFS = async () => {
  const picFolder = CONFIG.picPath;
  const vidFolder = CONFIG.vidPath;
  const tempFolder = CONFIG.tempPath;

  //test vid folder first
  try {
    // Read all items in the directory
    const itemArray = await fs.readdir(vidFolder);

    for (let i = 0; i < itemArray.length; i++) {
      const filePath = path.join(vidFolder, itemArray[i]);
      console.log("FILE PATH");
      console.log(filePath);

      const vidParams = {
        keyToLookup: "savePath",
        itemValue: filePath,
      };

      const vidModel = await dbModel(vidParams, CONFIG.vidsDownloaded);
      const vidData = await vidModel.getUniqueItem();

      console.log("VID DATA");
      console.log(vidData);

      // try {
      //   // Get file stats
      //   const stats = await fs.stat(filePath);

      //   // Skip if it's a directory
      //   if (stats.isDirectory()) {
      //     continue;
      //   }

      //   // Delete file if it's smaller than minimum size
      //   if (stats.size < minSizeBytes) {
      //     await fs.unlink(filePath);
      //     console.log(`Deleted: ${filePath} (${stats.size} bytes)`);
      //   } else {
      //     console.log(`Kept: ${filePath} (${stats.size} bytes)`);
      //   }
      // } catch (fileError) {
      //   console.error(`Error processing ${filePath}:`, fileError.message);
      // }
    }
  } catch (error) {
    console.error(`Error reading directory ${folderPath}:`, error.message);
  }
};
