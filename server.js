const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection URL (Standard URI format to bypass SRV issues on old driver)
const url = 'mongodb://tanish50:Tanish2410@ac-48cups9-shard-00-00.yuahriw.mongodb.net:27017,ac-48cups9-shard-00-01.yuahriw.mongodb.net:27017,ac-48cups9-shard-00-02.yuahriw.mongodb.net:27017/?ssl=true&replicaSet=atlas-eq9t8s-shard-0&authSource=admin&appName=Cluster0';
const dbName = 'contactManager';
let db;

// Connect to MongoDB
MongoClient.connect(url, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to Database');
    db = client.db(dbName);
    const contactsCollection = db.collection('contacts');

    // --- API ROUTES ---

    // GET all contacts
    app.get('/api/contacts', (req, res) => {
      contactsCollection.find().toArray()
        .then(results => {
          res.json(results);
        })
        .catch(error => console.error(error));
    });

    // POST a new contact
    app.post('/api/contacts', (req, res) => {
      contactsCollection.insertOne(req.body)
        .then(result => {
          // mongodb 3.x insertOne returns { insertedCount: 1, insertedId: <id>, ops: [...] }
          res.json(result.ops[0]);
        })
        .catch(error => console.error(error));
    });

    // PUT (update) a contact
    app.put('/api/contacts/:id', (req, res) => {
      const id = req.params.id;
      // Filter out _id if it's in the body
      const { _id, ...updateData } = req.body;
      
      contactsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnOriginal: false }
      )
        .then(result => {
          res.json(result.value);
        })
        .catch(error => console.error(error));
    });

    // DELETE a contact
    app.delete('/api/contacts/:id', (req, res) => {
      const id = req.params.id;
      contactsCollection.deleteOne({ _id: new ObjectId(id) })
        .then(result => {
          if (result.deletedCount === 1) {
            res.json({ message: 'Deleted successfully' });
          } else {
            res.status(404).json({ message: 'Contact not found' });
          }
        })
        .catch(error => console.error(error));
    });

    // Start server
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  })
  .catch(error => console.error('Failed to connect to MongoDB', error));
