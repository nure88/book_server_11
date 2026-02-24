const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require("express");
const cors = require("cors");
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// firebase admin service key
const admin = require("firebase-admin");
// index.js
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const port = 5000;

//
// book_db

// middleware
app.use(express.json());
app.use(cors());

// app.use(cors({
//     origin: ["http://localhost:5173/"]
// }));

app.get("/", (req, res) => {
  res.send("Book server is running");
});



const uri =`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@app.zxmaonq.mongodb.net/?appName=app`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async(req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
 return res.status(401).send({
  message: "unauthorized access. token not found"
 })
  }
  const token = authorization.split(' ')[1];
  try{

   await admin.auth().verifyIdToken(token);

  
  next();
  
}catch(err){
res.status(401).send({
  message: 'unauthorized access.'
})
}
};
// app.use(verifyToken);

async function run() {
  try {
    // await client.connect();

    const db = client.db("book-db");
    const bookCollection = db.collection("books");


// “Top Genres” – display book genres with images
    app.get("/top-genres", async (req, res) => {
      const book = req.body;

      const result = await bookCollection
        .find(book)
        .sort({ genres: -1 })
        .limit(1)
        .toArray();
      res.send(result);
    });

    // single book
    app.get("/books/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      const objectId = new ObjectId(id);
      const result = await bookCollection.findOne({ _id: objectId });

      res.send({
        result,
        success: true,
      });
    });

    // latest 6 book
    app.get("/latest-books", async (req, res) => {
      const book = req.body;

      const result = await bookCollection
        .find(book)
        .sort({ _id: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    // get all book
    app.get("/books", async (req, res) => {
      const books = req.body;

      const result = await bookCollection.find(books).toArray();
      res.send(result);
    });



app.get('/my-books', async (req,res) => {
  const email = req.query.email;
  // console.log(email);
  
const result = await bookCollection.find({userEmail:email}).toArray();
res.send(result);
});


    //  post api

    app.post("/books",verifyToken,async (req, res) => {
      const book = req.body;
      // console.log(book);

      const result = await bookCollection.insertOne(book);
      res.send({
        result,
        success: true,
      });
    });
    // update api
    app.put("/books/:id", async (req, res) => {
      const { id } = req.params;
      const body = req.body;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };

      const update = {
        $set: {
          title: body.title,
          author: body.author,
          genre: body.genre,
          rating: body.rating,
          summary: body.summary,
          coverImage: body.coverImage,
          userEmail: body.userEmail,
        },
      };
      const result = await bookCollection.updateOne(filter, update);

      res.send({
        result,
        success: true,
      });
    });

    // delete api
    app.delete("/books/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const result = await bookCollection.deleteOne(filter);

      res.send({
        success: true,
        result,
      });
    });

    await client.db("admin").command({ ping: 1 });
    // console.log(
      // "Pinged your deployment. You successfully connected to MongoDB!",
    // );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`https://localhost:${port}`);
});
