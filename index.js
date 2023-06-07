const express = require('express')
const app = express()
const port = process.env.PORT|| 5000
const cors = require('cors');
require('dotenv').config()
// const jwt = require('jsonwebtoken');

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Bornomala Acedamy Running....')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})