//TO DO:

//ADD one more set of stats at very end showing TOTAL articles, pics, vids, vidPages, picSets 
// uploaded ALL TIME / NOT single scrape(just use mongo)

//BUILD GET STATUS INTO DISPLAY ONLY (look up log collection)

//BUILD BACKUP VID DOWNLOAD (normal, 1 at a time)

import CONFIG from "./config/config.js";
import express from "express";
import cors from "cors";

import routes from "./routes/router.js";
import * as db from "./data/db.js";

import { scrapeNewKCNA } from "./src/scrape-control.js";

//FIRST CONNECT TO DB
// (need this HERE bc main function will execute before express and fuck everything)
await db.dbConnect();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.use(routes);

//RUN FUNCTION
// scrapeNewKCNA(); //turn off for testing

//PORT to listen
// app.listen(CONFIG.port);
app.listen(1951);

//CATCH CODE (for ref)
// console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
