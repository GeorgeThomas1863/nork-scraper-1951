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

      const vidParams = {
        keyToLookup: "savePath",
        itemValue: filePath,
      };

      const vidModel = new dbModel(vidParams, CONFIG.vidsDownloaded);
      const vidData = await vidModel.getUniqueItem();
      //set to 0 if cant find vid
      const vidTrueSize = vidData?.vidSizeBytes || 0;
      const vidCheckSize = vidTrueSize * 0.8;

      try {
        // Get file stats
        const stats = await fs.stat(filePath);

        // Skip if it's a directory
        if (stats.isDirectory()) {
          continue;
        }

        // Delete file if it's smaller than minimum size
        if (stats.size < vidCheckSize) {
          await fs.unlink(filePath);
          console.log("AHHHHHHHHH");
          console.log(`Deleted: ${filePath} (${stats.size} bytes)`);
        } else {
          console.log(`Kept: ${filePath} (${stats.size} bytes)`);
        }
      } catch (e) {
        console.log(e);
        // console.error(`Error processing ${filePath}:`, fileError.message);
      }
    }
  } catch (e) {
    console.log(e);
    // console.error(`Error reading directory ${folderPath}:`, error.message);
  }

  return true;
};
