//TO DO:

//unfuck tg post

//FIX VID DOWNLOAD / UPLOAD STORAGE

//SET THE UPLOAD SIZE ON VIDS SO THEY AUTO PLAY

//REFACTOR TgReq (re-remove the bottom shit into own module)

//BUILD BACKUP VID DOWNLOAD (normal, 1 at a time)

//BUILD API [AGAIN THE POINT OF ALL THIS SHIT]

import CONFIG from "./config/scrape-config.js";
import express from "express";
import routes from "./routes/router.js";
import * as db from "./data/db.js";

import { scrapeNewKCNA } from "./src/scrape-control.js";

//FIRST CONNECT TO DB
// (need this HERE bc main function will execute before express and fuck everything)
await db.dbConnect();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(routes);

//RUN FUNCTION
scrapeNewKCNA();

//PORT to listen
// app.listen(CONFIG.port);
app.listen(1950);

//CATCH CODE (for ref)
// console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
