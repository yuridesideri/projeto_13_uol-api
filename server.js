import express from "express";
import cors from "cors";
import { client, usersCol, messagesCol } from './database.js';
import dayjs from "dayjs";


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

server.post('/messages', 
    async (req, res) =>{
        const time = dayjs().locale('pt-br').format('HH:mm:ss');
        try {
            messagesCol.insertOne({...req.body, from: req.headers.user, time: time})
            res.sendStatus(200);
        } catch {
            res.sendStatus(400);
        }
    }
)

server.get('/messages', 
    async (req, res) =>{
    const limit = parseInt(req.query.limit);
    //limit not applied yet!!
    try {
        const query =  await messagesCol.find().toArray();
        res.status(200);
        res.send(query);
    } catch {
        res.sendStatus(400);
    }
    }
)

server.post('/status', 
    async (req, res) => {
        const {user} = req.headers;
        try{
            await usersCol.updateOne({name: user}, {$set: {lastStatus: Date.now()}})
            res.sendStatus(200);
        } catch {
            res.sendStatus(404);
        }
    })


