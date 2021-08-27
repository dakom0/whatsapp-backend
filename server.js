import express  from 'express'
import mongoose from 'mongoose'
import Messages from './db.js'
import Pusher from 'pusher'
import cors from 'cors'
import dotenv from 'dotenv'

// app config
const app = express()
const port = process.env.PORT || 9000

dotenv.config()

const pusher = new Pusher({
    appId: '1071594',
    key: 'ee7f716a237417152a4f',
    secret: '43d1459290889aa7a6c0',
    cluster: 'mt1',
    encrypted: true
});


// middleware
app.use(express.json());
app.use(cors());


// DB config
const conn = process.env.DB_CONNECTION

mongoose.connect(conn, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const db = mongoose.connection

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("whatsappdatas");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) =>{
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', 
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                }
            );
        } else {
            console.log("Error triggering Pusher");
        }
    })
})

// api routes
app.get('/', (req, res) => res.status(200).send("Hello world"))


app.get('/messages/sync', (req, res)=> {

    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
});

app.post('/messages/new', (req, res)=> {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
});

app.delete('/messages/del', (req, res)=> {

       Messages.deleteMany()
});



// listen
app.listen(port, () => console.log(`listening on localhost: ${port}`));