import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();
const uri =  process.env.DB_URI;

export const client = new MongoClient(uri);
const database =  client.db('uol-api');
export const usersCol =  database.collection('users_collection');
export const messagesCol =  database.collection('messages_collection');



