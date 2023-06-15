const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n0q8wig.mongodb.net/?retryWrites=true&w=majority`;

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

    const usersCollection = client.db("escoffierDb").collection("users");
    const classesCollection = client.db("escoffierDb").collection("classes");
    const enrollsCollection = client.db("escoffierDb").collection("enrolls");

    // users related apis
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      const query = { role: "instructor" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users/role/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: body.role,
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // classes related api
    app.get("/classes", async (req, res) => {
      const instructorEmail = req.query.email;
      let query = {};
      if (instructorEmail) {
        query = { instructor_email: instructorEmail };
      }
      const result = await classesCollection
        .find(query)
        .sort({ enrolled_student: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/approved", async (req, res) => {
      const query = { status: "approve" };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.findOne(query);
      res.send(result);
    });

    app.post("/classes", async (req, res) => {
      const addedClass = req.body;
      const result = await classesCollection.insertOne(addedClass);
      res.send(result);
    });

    app.patch("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: body,
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = {
        upsert: true,
      };
      const updateDoc = {
        $set: {
          feedback: body.feedback,
        },
      };
      console.log(updateDoc);
      const result = await classesCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // enrolls related apis
    app.get("/enrolls", async (req, res) => {
      const email = req.query.email;
      const query = { student_email: email };
      const result = await enrollsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/enrolls", async (req, res) => {
      const body = req.body;
      const query = {
        student_email: body.student_email,
        class_name: body.class_name,
      };
      const existingClass = await enrollsCollection.findOne(query);
      console.log(existingClass);
      if (existingClass) {
        return res.status(400).send({ message: "Class already exists" });
      }
      const result = await enrollsCollection.insertOne(body);
      res.send(result);
    });

    app.delete("/enrolls/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await enrollsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Escoffier is running");
});

app.listen(port, () => {
  console.log(`Escoffier is running on port ${port}`);
});
