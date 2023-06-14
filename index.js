const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" });
  }
  //
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorize access" });
    }
    req.decoded = decoded;
    next();
  });
};

//
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f6umtwj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //
    // classes
    const classCollection = client.db("onlineDb").collection("classes");
    const cartsCollection = client.db("onlineDb").collection("carts");
    const usersCollection = client.db("onlineDb").collection("users");
    app.get("/classes", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });
    // carts get
    app.get("/carts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      //
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(401).send({ error: true, message: "not access" });
      }
      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });
    // carts post
    app.post("/carts", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cartsCollection.insertOne(item);
      res.send(result);
    });
    // carts delete
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(query);
      res.send(result);
    });
    // instructors
    const instructorsCollection = client
      .db("onlineDb")
      .collection("instructors");

    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });
    // user get
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // user post
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user?.email };
      const existingUser = await usersCollection.findOne(query);
      console.log(existingUser);
      if (existingUser) {
        return res.send({ message: "user already exits" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    // admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // user get
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
//
app.get("/", (req, res) => {
  res.send("online school connected");
});

app.listen(port, () => {
  console.log(`online school is connected with port ${port}`);
});
