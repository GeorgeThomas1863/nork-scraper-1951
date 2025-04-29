//SWITCH EVERYTING TO AXIOS NOT FETCH

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
  async tgGet(tokenIndex) {
    const { offset } = this.dataObject;
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}`;

    //NO TRY CATCH (fucks up tokenIndex)
    const res = await fetch(url);
    const data = await res.json();

    //check token
    const checkModel = new TgReq({ data: data });
    const checkData = await checkModel.checkToken();

    if (checkData) {
      const inputData = this.dataObject;
      const retryModel = new TgReq({ inputData: inputData });
      const retryData = await retryModel.tgGet(TgReq.tokenIndex);
      return retryData;
    }

    return data;
  }

  /**
   * Sends a POST request to the Telegram API with the specified command
   * @function tgPost
   * @params command (command to send to tg); tokenIndex
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPost(tokenIndex) {
    const { inputObj } = this.dataObject;
    const { command, params } = inputObj;
    const token = tokenArray[tokenIndex];
    const url = `https://api.telegram.org/bot${token}/${command}`;

    //send data (NO TRY CATCH, fucks up token Index, IF YOU DONT FUCKING RETURN IT)
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    //check token
    const checkModel = new TgReq({ data: data });
    const checkData = await checkModel.checkToken();

    if (checkData) {
      const inputData = this.dataObject;
      const retryModel = new TgReq({ inputData: inputData });
      const retryData = await retryModel.tgPost(TgReq.tokenIndex);
      return retryData;
    }
    return data;
  }

  /**
   * Uploads and sends a photo to a Telegram chat using the Telegram API
   * @function tgPicFS
   * @param {number} tokenIndex - Index of the bot token to use from the tokenArray
   * @returns {Promise<Object>} The JSON response from the Telegram API
   */
  async tgPicFS(tokenIndex) {
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

  //-----------------------------

  // /**
  //  * TG sendMessage API, sends message chunk to TG (chunk before using) with auto token rotation
  //  * @function sendMessageChunkTG
  //  * @param {Object} params - Message parameters
  //  * @returns {Promise<Object>} Response data from Telegram API
  //  */
  // async sendMessageChunkTG(tokenIndex) {
  //   const tgModel = new TgReq(this.dataObject);

  //   //check token
  //   let data = await tgModel.tgPost("sendMessage", tokenIndex);
  //   const checkData = this.checkToken(data);
  //   if (checkData) data = await tgModel.tgPost("sendMessage", tokenIndex); //run again

  //   return data;
  // }

  //--------------------------

  async postArticleTitleTG() {
    const { inputObj } = this.dataObject;

    if (!inputObj) return null;

    const { title, date } = inputObj;
    const titleText = "--------------" + "\n\n" + "<b>" + title + "</b>" + "\n" + "<i>" + date + "</i>" + "\n\n" + "--------------";

    const params = {
      chat_id: CONFIG.tgUploadId,
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
    const { kcnaId, savePath, date } = inputObj;

    console.log("INPUT OBJECT");
    console.log(inputObj);

    //post pic
    const postParams = {
      chatId: CONFIG.tgUploadId,
      picPath: savePath,
    };

    const postModel = new TgReq(postParams);
    const postData = await postModel.tgPicFS(TgReq.tokenIndex);

    const caption = "<b>PIC: " + kcnaId + ".jpg</b>" + "\n" + "<i>" + date.toLocaleDateString() + "</i>";

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
    const storeData = await storeModel.storeUniqueURL();

    console.log("!!!!!!!!");
    console.log(storeData);

    return storeObj;
  }
}

export default TgReq;
