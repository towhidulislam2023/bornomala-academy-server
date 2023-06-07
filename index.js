const express = require('express')
const app = express()
const port = process.env.PORT|| 5000
const cors = require('cors');
require('dotenv').config()
// const jwt = require('jsonwebtoken');
// bornomalaAcademy 
// c9cjsY0Bck61fuEP
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Bornomala Acedamy Running....')
})

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://bornomalaAcademy:c9cjsY0Bck61fuEP@cluster0.w8zzyxt.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const classesCollection = client.db("bornomala-academy").collection("classes")
        const instructorsCollection = client.db("bornomala-academy").collection("instructors")
        app.get("/classes",async (req,res)=>{
            const result = await classesCollection.find().toArray()
            res.send(result)
        })
        
        app.get("/popularClasses",async (req,res)=>{
            const result = await classesCollection.find().sort({ availableSeats: 1 }).limit(6).toArray()
            res.send(result)
        })
        app.get("/popularinstructors",async (req,res)=>{
            const result = await instructorsCollection.find().sort({ totalStudents: 1 }).limit(6).toArray()
            res.send(result)
        })
        app.get("/instructors",async (req,res)=>{
            const result = await instructorsCollection.find().toArray()
            res.send(result)
        })
        







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);








app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})