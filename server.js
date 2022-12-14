import express from "express";
import cors from "cors";
import { usersCol, messagesCol } from './database.js';
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
        const {user} = req.headers;
        const time = dayjs().locale('pt-br').format('HH:mm:ss');
        const schema = Joi.object({
            to: Joi.string().required(),
            text: Joi.string().required(),
            type: Joi.any().valid('private_message','message').required(),
            from: Joi.string(),
            time: Joi.string()
        })
        
        if(req.body.to !== 'Todos'){
            try{
                const participants = await (usersCol.find()).toArray();
                console.log(participants);
                const {name: test1} = participants.find(participant => participant.name === user);
                const {name: test2} = participants.find(participant => participant.name === req.body.to);
                if (!test1 || !test2) throw 'Person does not exist!';
            } catch (err){
                console.log(err);
                res.sendStatus(422);
                return;
            }
        }
        try {
            const obj = {...req.body, from: user, time: time} //Se pa era pra validar o "to"
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
    const limit = parseInt(req.query.limit) || 0;
    try {
        const query =  (await messagesCol.find().toArray()).slice(-limit);
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
            const {matchedCount} = await usersCol.updateOne({name: user}, {$set: {lastStatus: Date.now()}})
            if (matchedCount === 0) throw 'Not a User';
            res.sendStatus(200);
        } catch (err) {
            console.log(err)
            res.sendStatus(404);
        }
    }
)


const interval = setInterval(handleExpiration, 15000);
async function handleExpiration () {
    const time = dayjs().locale('pt-br').format('HH:mm:ss');
    const users = await usersCol.find().toArray();
    users.forEach( async ({lastStatus, name}) =>  {
            if (Date.now() - lastStatus > 10000){
                try {
                    await usersCol.deleteOne({name: name});
                    await messagesCol.insertOne({from: name, to: 'Todos', text: 'sai da sala...', type: 'status', time: time});
                } catch {
                    console.log('Unsuccesful user removal!');
                }
            }
        }
    )
}