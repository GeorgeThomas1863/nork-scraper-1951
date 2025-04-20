//TO DO:

//UNFUCK / FINISH VID LINK DOWNLOAD

//refactor some names, work with gemini / your ppt
//Get vid set working

//MAKE ARRAY OF PIC SET LIST PAGES (manual)
//MAKE ARRAY OF VID LIST PAGES

//PULL PIC SET URLs DEFINE THEM SEPARATELY
//PULL VID URLs

//GET PIC downloading working
//GET VID downloading working

//UPLOADING TO TG

//BUILD API [AGAIN THE POINT OF ALL THIS SHIT]

import CONFIG from "./config/scrape-config.js";
import express from "express";
import routes from "./routes/router.js";
import * as db from "./data/db.js";

import { scrapeKCNA } from "./src/scrape.js";

//FIRST CONNECT TO DB
// (need this HERE bc main function will execute before express and fuck everything)
await db.dbConnect();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(routes);

//RUN FUNCTION
scrapeKCNA();

//PORT to listen
// app.listen(CONFIG.port);
app.listen(1950);
