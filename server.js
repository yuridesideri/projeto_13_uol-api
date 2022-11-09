import express from "express";
import cors from "cors";
import { client, usersCol, messagesCol } from './database.js';


const server = express();
server.listen(5000);
server.use(cors());
server.use(express.json());

// 
server.post('/participants', 
    async (req, res) => {
        try {
            await usersCol.insertOne({...req.body, lastStatus: Date.now()})
            res.sendStatus(200);
        } catch{
            res.sendStatus(400);
        }
    }
)

server.get('/participants', 
    async  (req, res) => {
        try{
            const users = await usersCol.find().toArray();
            res.statusCode = 201;
            res.send(users);
        } catch {
            res.sendStatus(400);
        }
    } 
)





