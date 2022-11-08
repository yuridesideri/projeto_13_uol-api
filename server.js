import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();



const uri =  process.env.DB_URI;
const server = express();
server.use(cors());




