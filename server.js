import express from "express";
import cors from "cors";
import { client, usersCol, messagesCol } from './database.js';
import dayjs from "dayjs";
import Joi from "joi";


const server = express();
server.listen(5000);
server.use(cors());
server.use(express.json());


server.post('/participants', 
    async (req, res) => {
        const schema = Joi.object({
            name: Joi.string().required(),
        })
        const time = dayjs().locale('pt-br').format('HH:mm:ss');
        try {
            if ((await usersCol.find().toArray()).find(({name}) => name === req.body.name)) throw 'User already logged in';
            const validated = await schema.validateAsync({...req.body})
            await usersCol.insertOne({...validated, lastStatus: Date.now()})
            await messagesCol.insertOne({from: validated.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: time})
            res.sendStatus(201);
        } catch (err) {
            if (err === 'User already logged in'){
                res.sendStatus(409)
                console.log('User already logged in');
            }
            else if (err.details[0].type === 'string.empty'){
                res.sendStatus(422)
            }
            else res.sendStatus(422);
        }
    }
)

server.get('/participants', 
    async (req, res) => {
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
        const schema = Joi.object({
            to: Joi.string().required(),
            text: Joi.string().required(),
            type: Joi.any().valid('private_message','message').required(),
            from: Joi.string(),
            time: Joi.string()
        })
        const time = dayjs().locale('pt-br').format('HH:mm:ss');
        try {
            const obj = {...req.body, from: req.headers.user, time: time} //Se pa era pra validar o "to"
            const value = await schema.validateAsync(obj)
            await messagesCol.insertOne(value);
            res.sendStatus(201);
        } catch (err) {
            console.log(err);
            res.sendStatus(422);
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
    }
)


const interval = setInterval(handleExpiration, 15000);
async function handleExpiration () {
    const users = await usersCol.find().toArray();
    users.forEach( async ({lastStatus, name}) =>  {
            if (Date.now() - lastStatus > 10000){
                try {
                    await usersCol.deleteOne({name: name});
                    await messagesCol.insertOne({from: name, to: 'Todos', text: 'sai da sala...', type: 'status', time: 'HH:MM:SS'});
                } catch {
                    console.log('Unsuccesful user removal!');
                }
            }
        }
    )
}