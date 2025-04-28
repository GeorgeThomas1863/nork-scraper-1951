//SWITCH EVERYTING TO AXIOS NOT FETCH

/**
 * @fileoverview Self build TG API request handler
 * Has GET, POST [Edit Caption / Send Message], POST Pic, handles TG bot rate limiting
 * @module models/TgReq
 */

//import mods
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

import tokenArray from "../config/tg-bot.js";

class TgReq {
  constructor(dataObject) {
    this.dataObject = dataObject;
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

    //send data
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (e) {
      console.log(e);
    }
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

    //send data
    try {
      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(params),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      return data;
    } catch (e) {
      console.log(e);
      return e;
    }
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

    //upload Pic
    try {
      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
      });

      return res.data;
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  //PROB NOT NECESSARY
  /**
   * TG sendMessage API, sends message chunk to TG (chunk before using) with auto token rotation
   * @function sendMessageChunkTG
   * @param {Object} params - Message parameters
   * @returns {Promise<Object>} Response data from Telegram API
   */
  async sendMessageChunkTG(tokenIndex) {
    const tgModel = new TgReq(this.dataObject);

    //check token
    let data = await tgModel.tgPost("sendMessage", tokenIndex);
    const checkData = this.checkToken(data);
    if (checkData) data = await tgModel.tgPost("sendMessage", tokenIndex); //run again

    return data;
  }

  //MIGHT WANT TO CHANGE HOW BELOW HAPPENS
  /**
   * TG editMessageCaption API; edits the caption of a previously pic / message
   * @function editCaptionTG
   * @param {Object} inputObj - Response object from a previous sendPhoto API call, custom caption
   * @returns {Promise<Object>} Response data from Telegram API
   */
  async editCaptionTG(caption, tokenIndex) {
    //build params
    const params = {
      chat_id: this.dataObject.result.chat.id,
      message_id: this.dataObject.result.message_id,
      caption: caption,
    };

    const tgModel = new TgReq(params);

    let data = await tgModel.tgPost("editMessageCaption", tokenIndex);
    const checkData = this.checkToken(data);
    if (checkData) data = await tgModel.tgPost("editMessageCaption", tokenIndex); //if fucked run again

    return data;
  }

  // //PROB NOT NECESSARY
  // /**
  //  * TG sendPhoto API, posts images to TG channel / user, with auto token rotation
  //  * @function uploadPicsTG
  //  * @param {Object} params - Upload parameters
  //  * @returns {Promise<Object>} Response data from Telegram API
  //  */
  // async uploadPicsTG(tokenIndex) {
  //   const tgModel = new TgReq(this.dataObject);

  //   //check token
  //   let data = await tgModel.tgPicFS(tokenIndex);
  //   const checkData = this.checkToken(data);
  //   if (checkData) data = await tgModel.tgPicFS(tokenIndex); //run again

  //   return data;
  // }
}

export default TgReq;
