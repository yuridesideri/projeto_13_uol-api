import express from "express";
import cors from "cors";
import { client, usersCol, messagesCol } from './database.js';


const server = express();
server.use(cors());








client.close();