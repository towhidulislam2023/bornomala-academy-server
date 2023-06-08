const express = require('express')
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('Bornomala Acedamy Running....')
})

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

app.post('/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' })
    res.send({ token })
})
//  TODO: set Env File 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.VITE_USER_DB_NAME}:${process.env.VITE_USER_DB_PASS}@cluster0.w8zzyxt.mongodb.net/?retryWrites=true&w=majority`;

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
        const usersCollection = client.db("bornomala-academy").collection("users")
        const cartCollection = client.db("bornomala-academy").collection("Cart")
        const paymentCollection = client.db("bornomala-academy").collection("payments");


        //users 
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.get("/users/:email", async (req, res) => {
            const useremail = req.params.email
            const query = { email: useremail }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })




        // classes
        app.get("/classes", async (req, res) => {
            const result = await classesCollection.find().toArray()
            res.send(result)
        })

        app.get("/popularClasses", async (req, res) => {
            const result = await classesCollection.find().sort({ availableSeats: 1 }).limit(6).toArray()
            res.send(result)
        })

        app.get("/classes/:email", async (req, res) => {
            const instructorEmail = req.params.email
            const query = { email: instructorEmail };
            const result = await classesCollection.find(query).toArray()
            res.send(result)
        })

        // instructors
        app.get("/popularinstructors", async (req, res) => {
            const result = await instructorsCollection.find().sort({ totalStudents: - 1 }).limit(6).toArray()
            res.send(result)
        })
        app.get("/instructors", async (req, res) => {
            const result = await instructorsCollection.find().toArray()
            res.send(result)
        })
        app.get("/instructors/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) };
            const result = await instructorsCollection.findOne(query)
            res.send(result)
        })
        //cart 
        app.post("/carts", async (req, res) => {
            const selectedClass = req.body
            const result = await cartCollection.insertOne(selectedClass)
            res.send(result)
        })

        app.get("/carts", verifyJWT, async (req, res) => {
            const usersEmail = req.query.email
            const decodedEmail = req.decoded.email;
            if (usersEmail !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'forbidden access' })
            }
            if (!usersEmail) {
                res.send([]);
            }
            const query = { studentEmail: usersEmail }
            const result = await cartCollection.find(query).toArray()
            res.send(result)
        })
        app.delete("/carts/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })
        // payments 

        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        app.post('/payments', verifyJWT, async (req, res) => {
            const payment = req.body;
            const insertResult = await paymentCollection.insertOne(payment);

            const query = { _id: { $in: payment.courseId.map(id => new ObjectId(id)) } }
            const deleteResult = await cartCollection.deleteMany(query)

            res.send({ insertResult, deleteResult });
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