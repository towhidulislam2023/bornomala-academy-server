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





        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }
        const verifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'instructor') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }


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


        app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {

            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        app.put("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const updateInfo = req.body
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: updateInfo.role
                },
            };
            const result = await usersCollection.updateOne(query, updateDoc, options)
            res.send(result)
        })


        app.get("/users/:email", async (req, res) => {
            const useremail = req.params.email
            const query = { email: useremail }
            const result = await usersCollection.findOne(query)
            res.send(result)
        })




        // classes
        app.get("/classes", async (req, res) => {
            const query = { status: "approved" }
            const result = await classesCollection.find(query).toArray()
            res.send(result)
        })
        //pending class only admin can access
        app.get("/pendingclasses", verifyJWT, verifyAdmin, async (req, res) => {
            const query = { status: "pending" }
            const result = await classesCollection.find(query).toArray()
            res.send(result)
        })
        // denied class only admin can ssee 
        app.get("/deniedclasses", verifyJWT, verifyAdmin, async (req, res) => {
            const query = { status: "denied" }
            const result = await classesCollection.find(query).toArray()
            res.send(result)
        })
        // update Approve
        app.put('/classes/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const doc = req.body
            // console.log(doc, "doc");
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: doc.status
                },
            };
            const result = await classesCollection.updateOne(query, updateDoc, options)
            res.send(result)

        })
        app.patch('/classes/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const doc = req.body
            // console.log(doc, "doc");
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    feedback: doc.feedback,
                },
            };
            const result = await classesCollection.updateOne(query, updateDoc, options)
            res.send(result)

        })
        app.patch('/updateclasses/:id', verifyJWT, verifyInstructor, async (req, res) => {
            const id = req.params.id
            const doc = req.body
            // console.log(doc, "doc");
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: doc.name,
                    availableSeats: doc.availableSeats,
                    price: doc.price

                },
            };
            const result = await classesCollection.updateOne(query, updateDoc, options)
            res.send(result)

        })

        app.get("/allClasses", async (req, res) => {
            const result = await classesCollection.find().toArray()
            res.send(result)
        })

        app.get("/allClasses/:id", verifyJWT, async (req, res) => {
            const classesid = req.params.id;
            console.log(classesid);
            const query = { _id: new ObjectId(classesid) };
            const result = await classesCollection.findOne(query);
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
        app.get("/findclasses/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await classesCollection.findOne(query)
            res.send(result)
        })
        app.get("/instructorclasses/:email", verifyJWT, verifyInstructor, async (req, res) => {
            const instructorEmail = req.params.email
            const query = { email: instructorEmail };
            const result = await classesCollection.find(query).toArray()
            res.send(result)
        })
        // add classes by instructor 

        app.post("/classes", verifyJWT, verifyInstructor, async (req, res) => {
            const doc = req.body
            const result = await classesCollection.insertOne(doc)
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
        app.post("/instructors",verifyJWT,verifyAdmin, async (req, res) => {
            const doc = req.body
            const query = { email: doc.email }
            const existingInstructor = await instructorsCollection.findOne(query);

            if (existingInstructor) {
                return res.send({ message: 'Instructor already exists' })
            }
            const result = await instructorsCollection.insertOne(doc)
            res.send(result)
        })
        

        //cart 
        app.post("/carts", verifyJWT, async (req, res) => {
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
        app.put('/payments', verifyJWT, async (req, res) => {
            try {
                const id = req.query.id;
                const query = { _id: new ObjectId(id) };

                const classData = await classesCollection.findOne(query);
                if (!classData) {
                    return res.status(404).json({ message: `Class with ID ${id} not found` });
                }

                const availableSeats = classData.availableSeats;
                const updatedAvailableSeats = availableSeats - 1;

                const updateDoc = {
                    $set: {
                        availableSeats: updatedAvailableSeats
                    },
                };

                const result = await classesCollection.updateOne(query, updateDoc);
                if (result.modifiedCount === 0) {
                    return res.status(500).json({ message: 'Failed to update class' });
                }

                res.status(200).json({ message: 'Class updated successfully' });
            } catch (error) {
                console.error('Error updating class:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

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

            res.send({ insertResult });
        })


        app.get('/payments', async (req, res) => {
            try {
                const email = req.query.email;
                const query = { email: email };
                const payments = await paymentCollection.find(query).toArray();
                console.log(payments);

                if (payments.length === 0) {
                    return res.send([]);
                }

                const courseIds = payments.map(payment => new ObjectId(payment.classesItemId));
                console.log(courseIds);
                //console.log(courseIds);

                const classesData = await classesCollection.find({ _id: { $in: courseIds } }).toArray();
                // console.log(classesData);

                if (classesData.length === 0) {
                    return res.send([]);
                }

                res.send(classesData);
            } catch (error) {
                console.error('Error in fetching classes:', error);
                res.status(500).send({ error: 'Internal server error' });
            }
        });
        app.get("/paymentshistory", async (req, res) => {
            const useremail = req.query.email;
            const query = { email: useremail };
            const result = await paymentCollection
                .find(query)
                .sort({ date: -1 }) // Sort by date in descending order
                .toArray();
            res.send(result);
        });








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