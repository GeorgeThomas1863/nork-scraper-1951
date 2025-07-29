import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import FormData from "form-data";

import CONFIG from "../config/config.js";
import KCNA from "../models/kcna-model.js";
import Vid from "../models/vid-model.js";
import dbModel from "../models/db-model.js";
import UTIL from "../models/util-model.js";
import TG from "../models/tg-control-model.js";

import { getDataFromPath } from "./scrape-util.js";
import { scrapeState } from "./scrape-state.js";
import { deleteItemsMap } from "../config/map-scrape.js";

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

//FIND VID PAGES / GET VID URLs SECTION

export const buildVidList = async (inputHTML) => {
  try {
    //stop if needed
    if (!scrapeState.scrapeActive) return null;

    // Parse the HTML using JSDOM
    const vidListModel = new Vid({ html: inputHTML });
    const vidListArray = await vidListModel.getVidListArray();

    //sort and add id to vidPage
    const sortModel = new UTIL({ inputArray: vidListArray });
    const vidListSort = await sortModel.sortArrayByDate();

    //add vidPageId
    const idModel = new UTIL({ inputArray: vidListSort, inputType: "vidPageId" });
    const vidListNormal = await idModel.addListId();

    //store it
    const storeDataModel = new dbModel(vidListNormal, CONFIG.vidPageList);
    const storeData = await storeDataModel.storeArray();
    console.log(storeData);

    //(added sorting)
    return vidListArray;
  } catch (e) {
    console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  }
};

//---------------

//VID PAGE
export const buildVidPageContent = async (inputArray) => {
  const vidPageArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    //stop if needed
    if (!scrapeState.scrapeActive) return vidPageArray;

    try {
      const vidPageModel = new Vid({ inputObj: inputArray[i] });
      const vidPageObj = await vidPageModel.getVidPageObj();

      //add to array
      vidPageArray.push(vidPageObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  //return for tracking
  return vidPageArray;
};

//------------------------

//VID ITEM
export const buildVidData = async (inputArray) => {
  const vidDataArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    //stop if needed
    if (!scrapeState.scrapeActive) return vidDataArray;

    try {
      const vidModel = new Vid({ inputObj: inputArray[i] });
      const vidDataObj = await vidModel.getVidData();
      if (!vidDataObj) continue;

      vidDataArray.push(vidDataObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }
  return vidDataArray;
};

//----------------------------

//DOWNLOAD VID SECTION
export const downloadVidPageArray = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;
  const { vidsDownloaded } = CONFIG;

  //download just first item (below necessary for obj to be seen as array)
  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByKcnaId();
  if (!sortArray || !sortArray.length) return null;

  const downloadVidDataArray = [];
  // for (let i = 0; i < 1; i++) { //download 1 for TESTING
  for (let i = 0; i < sortArray.length; i++) {
    //stop if needed
    if (!scrapeState.scrapeActive) return downloadVidDataArray;

    try {
      const downloadVidObj = await downloadVidFS(sortArray[i]);
      if (!downloadVidObj) continue;

      //store it
      const storeObj = { ...sortArray[i], ...downloadVidObj };
      const storeModel = new dbModel(storeObj, vidsDownloaded);
      const storeData = await storeModel.storeUniqueURL();
      console.log("DOWNLOAD VID STORE DATA");
      console.log(storeData);

      downloadVidDataArray.push(storeObj);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return downloadVidDataArray;
};

let retryCount = 0;
export const downloadVidFS = async (inputObj) => {
  if (!inputObj) return null;
  const { vidName, url, totalChunks, vidSizeBytes } = inputObj;
  const { vidPath, tempPath, vidRetries } = CONFIG;

  //download output path
  const vidSavePath = `${vidPath}${vidName}.mp4`;

  console.log(`CURRENTLY DOWNLOADING VID: ${vidSavePath}`);

  //check if vid already exists there and delete it here if its fucked
  if (fs.existsSync(vidSavePath)) {
    const vidSize = fs.statSync(vidSavePath).size;
    if (vidSize * 1.2 < vidSizeBytes) {
      fs.unlinkSync(vidSavePath);
    }
  }

  const params = {
    url: url,
    tempPath: tempPath,
    vidSavePath: vidSavePath,
    totalChunks: totalChunks,
    vidSizeBytes: vidSizeBytes,
    vidName: vidName,
  };

  const vidModel = new KCNA({ inputObj: params });
  const vidObj = await vidModel.getVidMultiThread();

  console.log("DOWNLOAD VID OBJ");
  console.log(vidObj);
  if (!vidObj) return null;

  //make folder to save vid chunks
  const vidSaveFolder = `${vidPath}${vidName}_chunks/`;
  if (!fs.existsSync(vidSaveFolder)) {
    fs.mkdirSync(vidSaveFolder, { recursive: true });
  }

  //NOW RECHUNK THE MOTHERFUCKER WITH FFMPEG
  const vidChunkData = await chunkVidByLength(vidSavePath, vidSaveFolder);

  //if shit fails redownload without continuous loop
  if (!vidChunkData && retryCount < vidRetries) {
    await downloadVidFS(inputObj);
    retryCount++;
  }

  //delete vid to avoid saving twice
  if (!fs.existsSync(vidSavePath)) return null;
  fs.unlinkSync(vidSavePath);

  const returnObj = {
    vidDownloaded: true,
    chunksProcessed: vidObj.chunksProcessed,
    vidSaveFolder: vidSaveFolder,
  };

  //reset retry count
  retryCount = 0;

  return returnObj;
};

export const chunkVidByLength = async (inputPath, outputFolder) => {
  if (!fs.existsSync(outputFolder) || !fs.existsSync(inputPath)) return null;
  const { chunkLengthSeconds } = CONFIG;

  const outputPattern = path.join(outputFolder, "chunk_%03d.mp4");
  const command = `ffmpeg -i "${inputPath}" -c copy -segment_time ${chunkLengthSeconds} -f segment -reset_timestamps 1 "${outputPattern}"`;

  const { stderr } = await execAsync(command);
  console.log("DONE CHUNKING");
  console.log(stderr); // FFmpeg outputs progress to stderr

  return true;
};

//---------------------

//UPLOAD SHIT

export const uploadVidPageArrayTG = async (inputArray) => {
  if (!inputArray || !inputArray.length) return null;

  // console.log("!!!!!!!UPLOAD VID PAGE ARRAY");
  // console.log(inputArray);

  const sortModel = new UTIL({ inputArray: inputArray });
  const sortArray = await sortModel.sortArrayByDate();

  // console.log("SORT ARRAY");
  // console.log(sortArray);

  if (!sortArray || !sortArray.length) return null;

  const uploadDataArray = [];
  for (let i = 0; i < sortArray.length; i++) {
    //stop if needed
    if (!scrapeState.scrapeActive) return uploadDataArray;
    try {
      const vidUploadObj = await uploadVidFS(sortArray[i]);

      // const uploadModel = new Vid({ inputObj: inputObj });
      // const postVidPageObjData = await uploadModel.postVidPageObj();
      // if (!postVidPageObjData) continue;

      //Build store obj (just store object for first text chunk)
      // const storeObj = { ...inputObj };
      // storeObj.chat = postVidPageObjData?.chat;
      // storeObj.message_id = postVidPageObjData?.message_id;
      // storeObj.sender_chat = postVidPageObjData?.sender_chat;

      // //store data
      // const storeModel = new dbModel(storeObj, CONFIG.vidPagesUploaded);
      // const storeData = await storeModel.storeUniqueURL();
      // console.log(storeData);

      // uploadDataArray.push(storeObj);
    } catch (e) {
      // console.log(e);
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
  }

  return uploadDataArray;
};

export const uploadVidFS = async (inputObj) => {
  if (!inputObj) return null;
  const { url, vidURL, title } = inputObj;
  const { tgUploadId, vidsUploaded, vidsDownloaded } = CONFIG;

  // console.log("UPLOAD VID FS!!!!!!!!!!!!!");
  // console.log(inputObj);

  //get vidObj data
  const lookupParams = {
    keyToLookup: "url",
    itemValue: vidURL,
  };

  const vidObjModel = new dbModel(lookupParams, vidsDownloaded);
  const vidObjData = await vidObjModel.getUniqueItem();
  if (!vidObjData) return null;

  //add title
  vidObjData.title = title;

  //get text / date inputs
  const normalModel = new UTIL({ inputObj: vidObjData });
  const uploadObj = await normalModel.normalizeInputsTG();
  if (!uploadObj) return null;

  const { vidSaveFolder } = uploadObj;

  //check if vid folder exists
  if (!fs.existsSync(vidSaveFolder)) {
    const error = new Error("VID FOLDER DOESNT EXIST");
    error.url = url;
    error.function = "uploadVidFS";
    throw error;
  }

  //add channel upload
  uploadObj.tgUploadId = tgUploadId;
  uploadObj.scrapeId = scrapeState.scrapeId;

  // console.log("UPLOAD OBJ");
  // console.log(uploadObj);

  //upload title
  const tgModel = new TG({ inputObj: uploadObj });
  await tgModel.postTitleTG();

  //get vid chunks
  try {
    const vidChunkArray = await getVidChunksFromFolder(uploadObj);

    // console.log("VID CHUNK ARRAY");
    // console.log(vidChunkArray);

    if (!vidChunkArray || !vidChunkArray.length) return null;

    uploadObj.chunksToUpload = vidChunkArray.length;

    const uploadVidDataArray = [];
    for (let i = 0; i < vidChunkArray.length; i++) {
      if (!scrapeState.scrapeActive) return null;

      uploadObj.uploadIndex = i + 1;
      const uploadVidData = await uploadCombinedVidChunk(vidChunkArray[i], uploadObj);
      if (!uploadVidData) continue;

      console.log("UPLOAD VID DATA");
      console.log(uploadVidData);

      uploadVidDataArray.push(uploadVidData);
    }

    //store it
    if (!uploadVidDataArray || uploadVidDataArray.length) return null;

    //STEP 3 STORE VID UPLOAD
    const storeObj = { ...inputObj, uploadVidDataArray: uploadVidDataArray };

    console.log("STORE OBJ");
    console.log(storeObj);

    const storeModel = new dbModel(storeObj, vidsUploaded);
    const storeData = await storeModel.storeUniqueURL();
    console.log(storeData);

    return storeObj;
  } catch (e) {
    console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
  }
};

export const getVidChunksFromFolder = async (inputObj) => {
  if (!inputObj || !inputObj.vidSaveFolder) return null;
  const { vidSaveFolder } = inputObj;
  const { vidUploadNumber } = CONFIG;

  const chunkNameArrayRaw = await fsPromises.readdir(vidSaveFolder);
  if (!chunkNameArrayRaw || !chunkNameArrayRaw.length) return null;

  //loop through and pull out arrays of JUST vid chunks with length vidUploadNumber
  const vidChunkArray = [];
  let combineArray = [];
  for (let i = 0; i < chunkNameArrayRaw.length; i++) {
    const chunkName = chunkNameArrayRaw[i];
    const chunkPath = `${vidSaveFolder}${chunkName}`;

    //fail conditions
    if (!fs.existsSync(chunkPath) || !chunkName.endsWith(".mp4") || !chunkName.startsWith("chunk_")) continue;
    combineArray.push(chunkPath);

    if (combineArray.length !== vidUploadNumber) continue;
    vidChunkArray.push(combineArray);
    combineArray = [];
  }

  //add last item to array
  if (combineArray.length) vidChunkArray.push(combineArray);

  return vidChunkArray;
};

export const uploadCombinedVidChunk = async (inputArray, inputObj) => {
  if (!inputArray || !inputArray.length || !inputObj);
  const { uploadIndex, chunksToUpload, vidSaveFolder, vidName, tgUploadId, title, type, vidSizeBytes, url } = inputObj;

  // console.log(`UPLOADING VID CHUNK ${uploadIndex} OF ${chunksToUpload}`);

  // console.log("UPLOAD COMBINED VID CHUNK");
  // console.log(inputArray);
  // console.log(inputObj);

  const chunkFileName = `${vidName}_${uploadIndex}.mp4`;
  const combineVidPath = `${vidSaveFolder}${chunkFileName}`;

  //STEP 1: COMBINE VID CHUNKS
  const combineChunkParams = {
    inputArray: inputArray,
    vidSaveFolder: vidSaveFolder,
    vidName: vidName,
    uploadIndex: uploadIndex,
    combineVidPath: combineVidPath,
    chunkFileName: chunkFileName,
    vidSizeBytes: vidSizeBytes,
  };

  const combineVidObj = await combineVidChunks(combineChunkParams);
  if (!combineVidObj) return null;

  //STEP 2: BUILD FORM
  const formParams = {
    uploadPath: combineVidPath,
    uploadFileName: chunkFileName,
    tgUploadId: tgUploadId,
  };

  const form = await buildVidForm(formParams);
  if (!form) return null;

  //STEP 3: UPLOAD THE VID
  const uploadModel = new TG({ form: form });
  const uploadData = await uploadModel.postVidTG();

  //throw error if vid upload fails
  if (!uploadData || !uploadData.ok) {
    const error = new Error("FAILED TO UPLOAD COMBINED VID CHUNK");
    error.url = url;
    error.function = "uploadCombinedVidChunk";
    throw error;
  }

  // console.log("UPLOAD VID POSTED DATA");
  // console.log(uploadData);

  //STEP 4: EDIT VID CAPTION
  //just build stupid caption text here
  const titleNormal = `Video: <b>${title}</b>`;
  const titleStr = "🇰🇵 🇰🇵 🇰🇵";
  let captionText = "";
  if (chunksToUpload > 1) {
    captionText = `<b>Chunk:</b> ${uploadIndex} of ${chunksToUpload}\n\n ${titleNormal} ${titleStr}`;
  } else {
    captionText = `${titleNormal} ${titleStr} `;
  }

  const editCaptionParams = {
    editChannelId: uploadData.result.chat.id,
    messageId: uploadData.result.message_id,
    captionText: captionText,
  };

  // console.log("EDIT CAPTION PARAMS");
  // console.log(editCaptionParams);

  const editCaptionModel = new TG(editCaptionParams);
  const editCaptionData = await editCaptionModel.editVidCaption();
  if (!editCaptionData || !editCaptionData.ok) return null;

  fs.unlinkSync(combineVidPath);

  const returnObj = { ...combineVidObj, ...uploadData };
  returnObj.caption = captionText;
  returnObj.chunkFileName = chunkFileName;
  returnObj.combineVidPath = combineVidPath;

  // console.log("RETURN OBJ");
  // console.log(returnObj);s

  return returnObj;
};

//loop through and upload in groups of 10 (5 min vids)
export const combineVidChunks = async (inputObj) => {
  if (!inputObj) return null;
  const { vidSaveFolder, inputArray, combineVidPath, vidSizeBytes } = inputObj;

  // console.log("COMBINE VID CHUNKS");
  // console.log(inputObj);

  //check if vid already exists / is good, return if so
  if (fs.existsSync(combineVidPath)) {
    const vidSize = fs.statSync(combineVidPath).size;
    if (vidSize * 1.2 > vidSizeBytes) return true;

    fs.unlinkSync(combineVidPath);
  }

  //define things
  const concatListPath = `${vidSaveFolder}concat_list.txt`;

  //CREATE THE CONCAT LIST
  try {
    let concatList = "";
    for (const chunk of inputArray) {
      concatList += `file '${chunk}' \n`;
    }

    await fsPromises.writeFile(concatListPath, concatList);

    //build ffmpeg cmd and execute
    const cmd = `ffmpeg -f concat -safe 0 -i ${vidSaveFolder}concat_list.txt -c copy ${combineVidPath}`;
    await execAsync(cmd);

    await fsPromises.unlink(concatListPath);

    // Verify the combined video exists (async)
    try {
      await fsPromises.access(combineVidPath);
    } catch (accessError) {
      const error = new Error("COMBINE VID FAILED, COMBINED VID DOESN'T EXIST");
      error.content = "COMBINE COMMAND: " + cmd;
      error.function = "combineVidChunks";
      throw error;
    }

    return true;
  } catch (e) {
    // Clean up concat list if it exists and there was an error
    try {
      await fsPromises.unlink(concatListPath);
    } catch (cleanupError) {
      // Ignore cleanup errors - file might not exist
    }

    // Re-throw the original errors
    throw e;
  }
};

export const buildVidForm = async (inputObj) => {
  if (!inputObj) return null;
  const { uploadPath, tgUploadId, uploadFileName } = inputObj;

  // console.log("BUILD VID FORM INPUT OBJ");
  // console.log(inputObj);

  const readStream = fs.createReadStream(uploadPath);

  // Create form data for this chunk
  const formData = new FormData();
  formData.append("chat_id", tgUploadId);
  formData.append("video", readStream, {
    filename: uploadFileName,
  });

  //set setting for auto play / streaming
  formData.append("supports_streaming", "true");
  formData.append("width", "1280");
  formData.append("height", "720");

  if (!formData || !readStream) {
    const error = new Error("BUILD VID FORM FUCKED");
    error.content = "FORM DATA: " + formData;
    error.function = "buildVidForm";
    throw error;
  }

  return formData;
};

//---------------------------

//REDOWNLOAD VIDS

export const reDownloadVids = async (inputArray) => {
  const { collectionArr } = await deleteItemsMap("vids");

  const vidDownloadArray = [];
  for (let i = 0; i < inputArray.length; i++) {
    try {
      const savePath = inputArray[i];
      const fuckedObj = await getDataFromPath(savePath, "vids");
      if (!fuckedObj || !fuckedObj.url) continue;
      const { url } = fuckedObj;

      const deleteParams = {
        keyToLookup: "url",
        itemValue: url,
      };

      //loop through to delete from each collection
      for (let j = 0; j < collectionArr.length; j++) {
        const dataModel = new dbModel(deleteParams, collectionArr[j]);
        await dataModel.deleteItem();
      }

      //get vid headers
      const headerObj = await reDownloadVidHeaders(fuckedObj);

      // console.log("!!!HEADER OBJ");
      // console.log(headerObj);

      //redownload vid
      // const vidModel = new Vid({ inputObj: headerObj });
      // const vidObj = await vidModel.downloadVidItem();
      const vidObj = await downloadVidFS(headerObj);
      if (!vidObj || !vidObj.chunksProcessed) continue;

      //build return obj
      const storeObj = { ...headerObj };
      storeObj.chunksProcessed = vidObj.chunksProcessed;

      //store it
      const storeModel = new dbModel(storeObj, CONFIG.vidsDownloaded);
      await storeModel.storeUniqueURL();

      vidDownloadArray.push(storeObj);
    } catch (e) {
      console.log(e);
    }
  }

  return vidDownloadArray;
};

export const reDownloadVidHeaders = async (inputObj) => {
  const { url, vidId, scrapeId, date } = inputObj;

  //redo getting headers
  const headerParams = {
    url: url,
  };

  const headerModel = new KCNA(headerParams);
  const headerData = await headerModel.getMediaHeaders();
  if (!headerData) return null;

  console.log("VID HEADER DATA!!!!");
  console.log(headerData);

  //parse vid headers here [will prob need to change based on future headers]
  const parseModel = new Vid({ headerData: headerData });
  const headerObj = await parseModel.parseVidHeaders();

  // //add vid temp path
  // const vidTempPath = CONFIG.tempPath + vidId + ".mp4";

  //add back to obj
  headerObj.url = url;
  headerObj.vidId = vidId;
  headerObj.scrapeId = scrapeId;
  headerObj.date = date;
  // headerObj.vidTempPath = vidTempPath;

  //store it again
  const storeModel = new dbModel(headerObj, CONFIG.vids);
  await storeModel.storeUniqueURL();

  return headerObj;
};

// Split video into segments of specified duration
