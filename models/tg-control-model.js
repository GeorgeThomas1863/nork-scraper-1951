//import mods
import fs from "fs";
import FormData from "form-data";

import CONFIG from "../config/config.js";
import TgReq from "./tgReq-model.js";
import dbModel from "./db-model.js";

import { articleTypeTitleMap } from "../config/map-scrape.js";
import { continueScrape } from "../src/scrape-util.js";

class TG {
  static tokenIndex = 0;

  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  //POST TEXT

  async postTitleTG() {
    const { inputObj } = this.dataObject;
    if (!inputObj) return null;
    const { tgUploadId } = inputObj;

    const textModel = new TG({ inputObj: inputObj });
    const titleText = await textModel.buildTitleText();

    const params = {
      chat_id: tgUploadId,
      text: titleText,
      parse_mode: "HTML",
    };

    const postObj = {
      command: "sendMessage",
      params: params,
    };

    const tgModel = new TgReq({ inputObj: postObj });
    const data = await tgModel.tgPost(TgReq.tokenIndex);

    return data;
  }

  async buildTitleText() {
    const { inputObj } = this.dataObject;
    const { titleNormal, dateNormal } = inputObj;

    const firstStr = "🇰🇵 🇰🇵 🇰🇵" + "\n\n";

    const typeModel = new TG({ inputObj: inputObj });
    const typeStr = await typeModel.getTypeStr();

    const beginStr = firstStr + typeStr + "--------------" + "\n\n" + titleNormal + "\n" + "<i>" + dateNormal + "</i>" + "\n\n" + "--------------";

    //if no pics
    if (!inputObj.picArray || !inputObj.picArray.length) {
      return beginStr;
    }

    const { picArray } = inputObj;
    const lastItem = picArray.length - 1;

    console.log("PIC ARRAY!!!");
    console.log(picArray);

    const firstModel = new dbModel({ keyToLookup: "url", itemValue: picArray[0].url }, CONFIG.picsDownloaded);
    const firstObj = await firstModel.getUniqueItem();
    console.log("FIRST OBJ!!!");
    console.log(firstObj);

    const firstPic = firstObj.picId;

    const lastModel = new dbModel({ keyToLookup: "url", itemValue: picArray[lastItem].url }, CONFIG.picsDownloaded);
    const lastObj = await lastModel.getUniqueItem();
    const lastPic = lastObj.picId;

    const endStr = "\n\n" + "<b>" + picArray.length + " PICS</b>" + "\n" + firstPic + ".jpg - " + lastPic + ".jpg" + "\n";

    return beginStr + endStr;
  }

  async getTypeStr() {
    const { inputObj } = this.dataObject;
    const { articleType, articleId, picSetId, vidPageId } = inputObj;

    if (articleType) {
      const articleTypeStr = await articleTypeTitleMap(articleType);
      return "<b>ARTICLE TYPE:</b> " + articleTypeStr + " | ID: " + articleId + "\n\n";
    }

    if (picSetId || picSetId === 0) {
      return "<b>TYPE:</b> Pic Set | ID: " + picSetId + "\n\n";
    }

    if (vidPageId || vidPageId === 0) {
      return "<b>TYPE:</b> Vid | ID: " + vidPageId + "\n\n";
    }
  }

  async buildTextArrayTG() {
    const { inputObj } = this.dataObject;
    const { url, titleNormal, urlNormal, dateNormal } = inputObj;
    const { tgMaxLength } = CONFIG;

    //import as textInput to avoid confusion
    const textInput = inputObj.text;

    //define chunks
    const maxLength = tgMaxLength - titleNormal.length - dateNormal.length - url.length - 100;
    const chunkTotal = Math.ceil(textInput.length / maxLength);

    //if short return one array item
    if (textInput.length < maxLength) {
      const shortArray = [];
      const shortText = "<b>[ARTICLE TEXT]:</b>" + "\n\n" + textInput + "\n\n" + urlNormal;

      shortArray.push(shortText);
      return shortArray;
    }

    //otherwise build text array
    let chunkCount = 0;
    const textArray = [];
    for (let i = 0; i < textInput.length; i += maxLength) {
      chunkCount++;
      const chunk = textInput.substring(i, i + maxLength);

      //build params
      const chunkObj = {
        chunkCount: chunkCount,
        chunk: chunk,
        chunkTotal: chunkTotal,
      };

      const chunkParams = { ...chunkObj, ...inputObj };

      //get chunk text
      const chunkModel = new TG(chunkParams);
      const chunkText = await chunkModel.getChunkText();
      if (!chunkText) continue;

      textArray.push(chunkText);
    }

    return textArray;
  }

  async getChunkText() {
    const { chunk, chunkCount, chunkTotal, urlNormal } = this.dataObject;

    switch (chunkCount) {
      case 1:
        return "<b>[ARTICLE TEXT]:</b>" + "\n\n" + chunk;

      case chunkTotal:
        return chunk + "\n\n" + urlNormal;

      default:
        return chunk;
    }
  }

  async postTextArrayTG() {
    //destructure everything
    const { inputObj } = this.dataObject;
    const { textArray, tgUploadId } = inputObj;

    //post by looping through
    const postDataArray = [];
    for (let i = 0; i < textArray.length; i++) {
      const params = {
        chat_id: tgUploadId,
        text: textArray[i],
        parse_mode: "HTML",
      };

      const paramsObj = {
        params: params,
        command: "sendMessage",
      };

      const postModel = new TgReq({ inputObj: paramsObj });
      const postData = await postModel.tgPost();
      if (!postData || !postData.result) continue;

      postDataArray.push(postData.result);
    }

    return postDataArray;
  }

  //--------------

  //POST IMAGE

  async postPicTG() {
    const { inputObj } = this.dataObject;
    const { picId, savePath, dateNormal, tgUploadId } = inputObj;

    //post pic

    const postParams = {
      chatId: tgUploadId,
      picPath: savePath,
    };

    const postModel = new TgReq(postParams);
    const postData = await postModel.tgPicFS(TgReq.tokenIndex);
    if (!postData || !postData.result) return null;

    const caption = "<b>PIC: " + picId + ".jpg</b>" + "\n" + "<i>" + dateNormal + "</i>";

    //build edit caption params
    const editParams = {
      chat_id: postData.result.chat.id,
      message_id: postData.result.message_id,
      caption: caption,
      parse_mode: "HTML",
    };

    const paramObj = {
      params: editParams,
      command: "editMessageCaption",
    };

    //edit caption
    const editModel = new TgReq({ inputObj: paramObj });
    await editModel.tgPost(TgReq.tokenIndex);
    const storeObj = { ...inputObj, ...postData.result };

    //store pic Posted
    try {
      const storeModel = new dbModel(storeObj, CONFIG.picsUploaded);
      const storeData = await storeModel.storeUniqueURL();
      console.log("PIC " + picId + ".jpg UPLOADED AND STORED");
      console.log(storeData);
    } catch (e) {
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
    return storeObj;
  }

  //--------------------

  //POST VIDS

  async postVidTG() {
    const { inputObj } = this.dataObject;
    const { vidId, vidSizeBytes, picId, titleNormal, dateNormal, url } = inputObj;
    const chunkObj = { ...inputObj };

    //define chunk size
    chunkObj.chunkSize = 40 * 1024 * 1024; //40MB
    chunkObj.totalChunks = Math.ceil(vidSizeBytes / chunkObj.chunkSize);

    //build thumbnail path
    chunkObj.thumbnailPath = CONFIG.picPath + picId + ".jpg";

    //posts ALL chunks, edits the caption
    const postChunkModel = new TG({ inputObj: chunkObj });
    const chunkDataArray = await postChunkModel.postChunkArray();

    //STORE HERE
    if (!chunkDataArray || !chunkDataArray.length) return null;
    const storeObj = { ...inputObj, ...chunkDataArray[0] };
    storeObj.chunksUploaded = chunkDataArray.length;
    try {
      const storeModel = new dbModel(storeObj, CONFIG.vidsUploaded);
      const storeData = await storeModel.storeUniqueURL();
      console.log(storeData);
    } catch (e) {
      // console.log(e);
      console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
    }
    return storeObj;
  }

  async postChunkArray() {
    const { inputObj } = this.dataObject;
    const { totalChunks, chunkSize, vidSizeBytes } = inputObj;
    const chunkObj = { ...inputObj };

    //send each chunk
    const chunkDataArray = [];
    for (let i = 0; i < totalChunks; i++) {
      //STOP HERE if needed
      if (!continueScrape) return chunkDataArray;

      //define chunk
      const start = i * chunkSize;
      const end = Math.min(vidSizeBytes, start + chunkSize);
      chunkObj.start = start;
      chunkObj.end = end;
      chunkObj.chunkNumber = i;

      const postChunkModel = new TG({ inputObj: chunkObj });
      const postChunkData = await postChunkModel.postVidChunk();
      if (!postChunkData) continue;

      chunkDataArray.push(postChunkData);
    }

    return chunkDataArray;
  }

  //post each chunk, edit captions
  async postVidChunk() {
    const { inputObj } = this.dataObject;
    const { totalChunks, titleNormal, dateNormal, vidId, chunkNumber } = inputObj;

    //get chunk form
    const formModel = new TG({ inputObj: inputObj });
    const chunkForm = await formModel.getChunkForm();

    console.log("Uploading chunk " + (chunkNumber + 1) + " of " + totalChunks);

    //post chunk
    const postModel = new TgReq({ form: chunkForm });
    const chunkData = await postModel.tgVidFS(TgReq.tokenIndex);
    if (!chunkData || !chunkData.result) return null;

    //label the chunk (add caption)
    const caption = titleNormal + "\n" + "<i>" + dateNormal + "</i>" + "\n" + "VIDEO: " + vidId + ".mp4; [" + (chunkNumber + 1) + " of " + totalChunks + "]";

    //build edit caption params
    const editParams = {
      chat_id: chunkData.result.chat.id,
      message_id: chunkData.result.message_id,
      caption: caption,
      parse_mode: "HTML",
    };

    const paramObj = {
      params: editParams,
      command: "editMessageCaption",
    };

    //edit caption
    const editModel = new TgReq({ inputObj: paramObj });
    const editChunkData = await editModel.tgPost(TgReq.tokenIndex);
    if (!editChunkData || !editChunkData.result) return null;

    //return chunk data
    return chunkData;
  }

  async getChunkForm() {
    const { inputObj } = this.dataObject;
    const { savePath, tgUploadId, thumbnailPath, start, end, chunkNumber, totalChunks } = inputObj;

    const readStream = fs.createReadStream(savePath, { start: start, end: end - 1 });

    // Create form data for this chunk
    const formData = new FormData();
    formData.append("chat_id", tgUploadId);
    formData.append("video", readStream, {
      filename: `chunk_${chunkNumber}_of_${totalChunks}.mp4`,
      knownLength: end - start,
    });

    //set setting for auto play / streaming
    formData.append("supports_streaming", "true");
    formData.append("width", "1280");
    formData.append("height", "720");

    //add thumbnail
    formData.append("thumb", fs.createReadStream(thumbnailPath));

    return formData;
  }
}

export default TG;
