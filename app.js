//TO DO:

//ADD MB SIZE TO VIDS / PICS!!!!!!!!! bytes/1,048,576

//LOOK IN NORK SCRAPER 4000 for upload CODE 

//UPLOADING TO TG

//TONS OF REFACTORING NEEDED

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
