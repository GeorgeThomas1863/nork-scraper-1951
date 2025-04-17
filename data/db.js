/**
 * @fileoverview MongoDB database connection configuration
 * @module data/db
 */

import { MongoClient } from "mongodb";
import CONFIG from "../config/scrape-config.js";

let db;

export const dbConnect = async () => {
  //connect to mongo server
  const client = await MongoClient.connect("mongodb://localhost:27017");
  db = client.db(CONFIG.dbName);
};

export const dbGet = () => {
  //ensure db connection is working
  if (!db) {
    throw { message: "Database connection fucked" };
  }
  return db;
};
