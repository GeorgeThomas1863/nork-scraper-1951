//TO DO:

//BUILD BACK IN WAY TO TURN OFF SCHEDULER

//in CLEAN-FS BUILD A WAY TO CLEAN / UPDATE THE MONGO DB [way to see if anything is missing and add if it is]

//re-download should be unfucked? going to deploy and try

//-------------------

//try deploying, but keep testing redownload

//multi chunk upload STILL FUCKED?

//FIX PIC SET ID SAVE (seems to be failign to store last pic set id)

//refactor parseAdmin command

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

//RUN FUNCTION
// scrapeNewKCNA(); //turn off for testing

//PORT to listen
app.listen(CONFIG.scrapePort);
// app.listen(1951);

//CATCH CODE (for ref)
// console.log(e.url + "; " + e.message + "; F BREAK: " + e.function);
