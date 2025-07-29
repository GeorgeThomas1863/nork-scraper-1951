//TO DO:

//SCHEDULER STILL FUCKED, maybe not starting log right?? FIX

//BUILD KCTV INTO DISPLAY

//FIX HOW THE VID FAIL WORKS

//KEEP TESTING SCHEDULER; RUN ON BLANK DB (AND SEE IF WORKS AFTER AN HOUR) [change interval test]

//in CLEAN-FS UPDATE THE MONGO DB CLEANUP AT END [way to see if anything is missing and add if it is]

//re-download should be unfucked? going to deploy and try

//-------------------

//BUILD BACKUP VID DOWNLOAD (normal, 1 at a time)

import CONFIG from "./config/config.js";
import express from "express";
import cors from "cors";

import routes from "./routes/router.js";
import * as db from "./config/db.js";

// import { scrapeNewKCNA } from "./src/scrape-control.js";

//FIRST CONNECT TO DB
// (need this HERE bc main function will execute before express and fuck everything)
await db.dbConnect();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors());

app.use(routes);

//PORT to listen
app.listen(CONFIG.scrapePort);

//CATCH CODE (for ref)
// console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
