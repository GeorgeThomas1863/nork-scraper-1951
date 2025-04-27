import CONFIG from "../config/scrape-config.js";
import TgReq from "../models/tg-model.js";

export const postArticleTitleTG = async (inputObj) => {
  if (!inputObj) return null;

  const { title, date } = inputObj;
  const titleText = title + "; <i>" + date + "</i>";

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
  const tgData = await tgModel.tgPost();
  console.log(tgData);

  return tgData;
};

export const postPicTG = async (inputObj) => {
  const { savePath } = inputObj;

  const params = {
    chatId: CONFIG.tgUploadId,
    picPath: savePath
  }

  const tgModel = new TgReq(params)
  const tgData = await tgModel.tgPicFS()
  console.log(tgData)

  //EDIT PIC CAPTION

  //STORE PIC AS UPLOADED

};
