/**
 * @fileoverview Self build TG API request handler / library
 * @module models/TgReq
 */

//import mods
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

import CONFIG from "../config/scrape-config.js";
import tokenArray from "../config/tg-bot.js";
import dbModel from "./db-model.js";

class TgReq {
  static tokenIndex = 0;

  constructor(dataObject) {
    this.dataObject = dataObject;
  }

  async checkToken() {
    const { data } = this.dataObject;

    //429 bot fucked error
    if (!data || (data && data.ok) || (data && !data.ok && data.error_code !== 429)) return null;

    console.log("AHHHHHHHHHH");

    TgReq.tokenIndex++;
    if (TgReq.tokenIndex > 11) TgReq.tokenIndex = 0;

    console.log("GOT 429 ERROR, TRYING NEW FUCKING BOT. TOKEN INDEX: " + TgReq.tokenIndex);
    return TgReq.tokenIndex;
  }

  /**
   * Sends a GET request to the Telegram API to fetch updates
   * @function tgGet
   * @param {number} tokenIndex - Index of the bot token to use from the tokenArray
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgGet(tokenIndex = 0) {
    const { offset } = this.dataObject;
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}`;

    //NO TRY CATCH (fucks up tokenIndex)
    const res = await axios.get(url);

    //check token
    const checkModel = new TgReq({ data: res.data });
    const checkData = await checkModel.checkToken();

    if (checkData) {
      const inputData = this.dataObject;
      const retryModel = new TgReq({ inputData: inputData });
      const retryData = await retryModel.tgGet(TgReq.tokenIndex);
      return retryData;
    }

    return res.data;
  }

  /**
   * Sends a POST request to the Telegram API with the specified command
   * @function tgPost
   * @params command (command to send to tg); tokenIndex
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPost(tokenIndex = 0) {
    const { inputObj } = this.dataObject;
    const { command, params } = inputObj;
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/${command}`;

    //send data (NO TRY CATCH, fucks up token Index, IF YOU DONT FUCKING RETURN IT)
    const res = await axios.post(url, params);

    //check token
    const checkModel = new TgReq({ data: res.data });
    const checkData = await checkModel.checkToken();

    if (checkData) {
      const inputData = this.dataObject;
      const retryModel = new TgReq({ inputData: inputData });
      const retryData = await retryModel.tgPost(TgReq.tokenIndex);
      return retryData;
    }
    return res.data;
  }

  /**
   * Uploads and sends a photo to a Telegram chat using the Telegram API
   * @function tgPicFS
   * @param {number} tokenIndex - Index of the bot token to use from the tokenArray
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPicFS(tokenIndex = 0) {
    const { chatId, picPath } = this.dataObject;

    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/sendPhoto`;

    //build form
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", fs.createReadStream(picPath));

    try {
      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
      });
      return res.data;
    } catch (e) {
      if (e.response && e.response.data) {
        //check token
        const checkModel = new TgReq({ data: e.response.data });
        const checkData = await checkModel.checkToken();

        if (checkData) {
          const inputData = this.dataObject;
          const retryModel = new TgReq(inputData);
          const retryData = await retryModel.tgPicFS(TgReq.tokenIndex);
          return retryData;
        }
      } else {
        return e;
      }
    }
  }

  async tgVidFS(tokenIndex = 0) {
    const { form } = this.dataObject;

    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/sendVideo`;

    try {
      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      console.log("RES DATA");
      console.log(res);
      return res.data;
    } catch (e) {
      if (e.response && e.response.data) {
        //check token
        const checkModel = new TgReq({ data: e.response.data });
        const checkData = await checkModel.checkToken();

        if (checkData) {
          const inputData = this.dataObject;
          const retryModel = new TgReq(inputData);
          const retryData = await retryModel.tgVidFS(TgReq.tokenIndex);
          return retryData;
        }
      } else {
        return e;
      }
    }
  }

  // async tgDocFS(tokenIndex = 0) {
  //   const { chatId, vidPath } = this.dataObject;

  //   const token = tokenArray[tokenIndex];
  //   const url = `https://api.telegram.org/bot${token}/sendDocument`;

  //   //build form
  //   const form = new FormData();
  //   form.append("chat_id", chatId);
  //   form.append("document", fs.createReadStream(vidPath));

  //   console.log("ALLAHU AKBAR");
  //   console.log(url);

  //   try {
  //     const res = await axios.post(url, form, {
  //       headers: form.getHeaders(),
  //     });

  //     console.log("DOC RES FAGGOT");
  //     console.log(res);
  //     return res.data;
  //   } catch (e) {
  //     if (e.response && e.response.data) {
  //       //check token
  //       const checkModel = new TgReq({ data: e.response.data });
  //       const checkData = await checkModel.checkToken();

  //       if (checkData) {
  //         const inputData = this.dataObject;
  //         const retryModel = new TgReq(inputData);
  //         const retryData = await retryModel.tgDocFS(TgReq.tokenIndex);
  //         return retryData;
  //       }
  //     } else {
  //       return e;
  //     }
  //   }
  // }

  //--------------------------

  //POST TEXT

  async postTitleTG() {
    const { inputObj } = this.dataObject;
    if (!inputObj) return null;
    const { tgUploadId } = inputObj;

    const textModel = new TgReq({ inputObj: inputObj });
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

    const beginStr = "🇰🇵 🇰🇵 🇰🇵" + "\n\n" + "--------------" + "\n\n" + titleNormal + "\n" + "<i>" + dateNormal + "</i>" + "\n\n" + "--------------";

    //if no pics
    if (!inputObj.picArray || !inputObj.picArray.length) {
      return beginStr;
    }

    const { picArray } = inputObj;
    const lastItem = picArray.length - 1;
    const firstKcnaId = +picArray[0].substring(picArray[0].length - 11, picArray[0].length - 4);
    const lastKcnaId = +picArray[lastItem].substring(picArray[lastItem].length - 11, picArray[lastItem].length - 4);

    const endStr = "\n\n" + "<b>" + picArray.length + " PICS</b>" + "\n" + firstKcnaId + ".jpg - " + lastKcnaId + ".jpg" + "\n";

    return beginStr + endStr;
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
      const chunkModel = new TgReq(chunkParams);
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
    const { kcnaId, savePath, dateNormal, tgUploadId } = inputObj;

    //post pic
    const postParams = {
      chatId: tgUploadId,
      picPath: savePath,
    };

    const postModel = new TgReq(postParams);
    const postData = await postModel.tgPicFS(TgReq.tokenIndex);
    if (!postData || !postData.result) return null;

    const caption = "<b>PIC: " + kcnaId + ".jpg</b>" + "\n" + "<i>" + dateNormal + "</i>";

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

    //store pic Posted
    const storeObj = { ...inputObj, ...postData.result };
    const storeModel = new dbModel(storeObj, CONFIG.picsUploaded);
    const storeData = await storeModel.storeUniqueURL();
    console.log("PIC " + kcnaId + ".jpg UPLOADED AND STORED");
    console.log(storeData);

    return storeObj;
  }

  //--------------------

  //POST VIDS

  async postVidTG() {
    const { inputObj } = this.dataObject;
    const { kcnaId, vidSizeBytes } = inputObj;
    const postVidObj = { ...inputObj };

    //define chunk size
    const chunkSize = 40 * 1024 * 1024; //40MB
    const totalChunks = Math.ceil(vidSizeBytes / chunkSize);
    postVidObj.totalChunks = totalChunks;

    console.log("TOTAL CHUNKS");
    console.log(totalChunks);

    //build thumbnail path
    const thumbnailPath = CONFIG.picPath + kcnaId + ".jpg";
    postVidObj.thumbnailPath = thumbnailPath;

    //send each chunk
    for (let i = 0; i < totalChunks; i++) {
      //define chunk
      const start = i * chunkSize;
      const end = Math.min(vidSizeBytes, start + chunkSize);
      console.log(start);
      console.log(end);
      postVidObj.start = start;
      postVidObj.end = end;
      postVidObj.chunkNumber = i;

      const chunkModel = new TgReq({ inputObj: postVidObj });
      const chunkData = await chunkModel.postVidChunk();

      console.log(chunkData);
    }

    //ADD CAPTION NEXT

    //THEN STORE IT
  }

  async postVidChunk() {
    const { inputObj } = this.dataObject;
    const { savePath, tgUploadId, vidSizeMB, thumbnailPath, start, end, chunkNumber, totalChunks } = inputObj;

    const readStream = fs.createReadStream(savePath, { start: start, end: end - 1 });

    // Create form data for this chunk
    const formData = new FormData();
    formData.append("chat_id", tgUploadId);
    formData.append("video", readStream, {
      filename: `chunk_${chunkNumber}_of_${totalChunks}.mp4`,
      knownLength: end - start,
    });
    formData.append("supports_streaming", "true");

    //add thumbnail
    formData.append("thumb", fs.createReadStream(thumbnailPath));

    console.log(`Uploading chunk ${chunkNumber} of ${totalChunks}...`);

    const postModel = new TgReq({ form: formData });
    const postData = await postModel.tgVidFS(TgReq.tokenIndex);

    return postData;
  }
}

export default TgReq;
