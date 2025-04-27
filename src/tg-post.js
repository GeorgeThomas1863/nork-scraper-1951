import CONFIG from "../config/scrape-config.js";
import TgReq from "../models/tg-model.js";

export const postTitleTG = async (inputObj) => {
  if (!inputObj) return null;

  const { title, date } = inputObj;
  const titleText = title + "\nDate: " + date;

  const params = {
    chat_id: CONFIG.tgUploadId,
    text: titleText,
    parse_mode: "HTML",
  };

  const postObj = {
    command: "sendMessage",
    params: params,
  };

  console.log("POST PARAMS");
  console.log(params);

  const tgModel = new TgReq({ inputObj: postObj });
  const tgData = await tgModel.tgPost();
  console.log(tgData);
};

export const postPicTG = async (inputObj) => {
  const { url } = inputObj;
};
