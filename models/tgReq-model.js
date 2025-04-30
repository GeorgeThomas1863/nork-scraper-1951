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

  //--------------------------

  async postArticleTitleTG() {
    const { inputObj } = this.dataObject;
    if (!inputObj) return null;
    const { titleNormal, dateNormal, tgUploadId } = inputObj;

    const titleText = "--------------" + "\n\n" + titleNormal + "\n" + "<i>" + dateNormal + "</i>" + "\n\n" + "--------------";

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

    //EDIT PIC CAPTION
    const editModel = new TgReq({ inputObj: paramObj });
    await editModel.tgPost(TgReq.tokenIndex);

    //store pic Posted
    const storeObj = { ...inputObj, ...postData.result };
    const storeModel = new dbModel(storeObj, CONFIG.picsUploaded);
    await storeModel.storeUniqueURL();

    return storeObj;
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

    console.log("STATS!!!!!!!!!!!");
    console.log(textInput.length);
    console.log(maxLength);
    console.log(chunkTotal);

    //if short return one array item
    if (textInput.length < maxLength) {
      const shortArray = [];
      const shortText = titleNormal + "\n" + dateNormal + "\n\n" + textInput + "\n\n" + urlNormal;
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
    const { chunk, chunkCount, chunkTotal, titleNormal, dateNormal, urlNormal } = this.dataObject;

    switch (chunkCount) {
      case 1:
        return "--------------" + "\n" + "<b>[ARTICLE TEXT:]</b>" + "\n\n" + chunk;

      case chunkTotal:
        return chunk + "\n\n" + urlNormal + "\n" + "--------------";

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
      if (!postData) continue;

      postDataArray.push(postData);
    }

    return postDataArray;
  }
}

export default TgReq;
