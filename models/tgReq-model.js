//import mods
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

import tokenArray from "../config/tg-bot.js";

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

    console.log("CHECK DATA");
    console.log(checkData);

    if (checkData) {
      const retryModel = new TgReq({ inputObj: inputObj });
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
}

export default TgReq;
