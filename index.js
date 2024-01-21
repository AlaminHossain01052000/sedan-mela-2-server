const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

// connecting node js with mongodb
const uri = `mongodb+srv://siyamrpsu:4wCxlcVEN0pQ0WDc@cluster0.fmrizb2.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 60000, // Adjust the timeout values as needed
    socketTimeoutMS: 60000,
  });
async function run() {
    try {
        await client.connect();
        const sedanCollection = client.db("sedan_mela").collection("ourSedans");
        const testimonialCollection = client.db("sedan_mela").collection("testimonials");
        const userCollection = client.db("sedan_mela").collection("users");
        const purchasedSedanCollection = client.db("sedan_mela").collection("purchasedSedan");

        
          
          
        

        // get all the review
        app.get("/testimonials", async (req, res) => {
            const testimonials = await testimonialCollection.find({}).toArray();
            res.json(testimonials);
        })

        // find a product using product id for purchasing
        app.get("/sedan/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await sedanCollection.findOne(query);
            res.json(result);
        })
        
        app.get("/sedans", async (req, res) => {
            // Extract filter criteria from query parameters
            const { engine, gear, gearType, fuelType, minPrice, maxPrice } = req.query;
        
            // Construct a query object based on the provided criteria
            const query = {};
        
            if (engine) query.engine = engine;
            if (gear) query.gear = parseInt(gear);
            if (gearType) query.gearType = gearType;
            if (fuelType) query.fuelType = fuelType;
            if (minPrice && maxPrice) query.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
            else if (minPrice) query.price = { $gte: parseInt(minPrice) };
            else if (maxPrice) query.price = { $lte: parseInt(maxPrice) };
        
            try {
                // Use your MongoDB collection instance to find matching sedans
                const result = await sedanCollection.find(query).toArray();
        
                // Return the result as JSON
                res.json(result);
            } catch (error) {
                console.error(error);
                // Handle the error and send an appropriate response
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        // Add a new route to get all unique engine types
        app.get("/sedans/engines", async (req, res) => {
            try {
                // Use your MongoDB collection instance to get distinct engine types
                const engineTypes = await sedanCollection.distinct("engine");
                res.json(engineTypes);
            } catch (error) {
                console.error(error);
                // Handle the error and send an appropriate response
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        app.get("/sedans/gears", async (req, res) => {
            try {
                // Use your MongoDB collection instance to get distinct engine types
                const gearTypes = await sedanCollection.distinct("gear");
                res.json(gearTypes);
            } catch (error) {
                console.error(error);
                // Handle the error and send an appropriate response
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
        // Add a new route to get all unique gear types
app.get("/sedans/gearTypes", async (req, res) => {
    try {
        // Use your MongoDB collection instance to get distinct gear types
        const gearTypes = await sedanCollection.distinct("gearType");
        res.json(gearTypes);
    } catch (error) {
        console.error(error);
        // Handle the error and send an appropriate response
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a new route to get all unique fuel types
app.get("/sedans/fuelTypes", async (req, res) => {
    try {
        // Use your MongoDB collection instance to get distinct fuel types
        const fuelTypes = await sedanCollection.distinct("fuelType");
        res.json(fuelTypes);
    } catch (error) {
        console.error(error);
        // Handle the error and send an appropriate response
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


        
        

        // get all booked product for admin to control in dashboard
        app.get("/purchasedSedan/All", async (req, res) => {
            const result = await purchasedSedanCollection.find({}).toArray();
            res.json(result);
        })

        // find booked products of a particular user
        app.get("/purchasedSedan", async (req, res) => {

            const email = req.query.email;
            const query = { email: email };
            const result = await purchasedSedanCollection.find(query).toArray();
            res.json(result);
        })

        // get all registered users
        app.get("/users", async (req, res) => {
            const allUsers = await userCollection.find({}).toArray();
            res.json(allUsers);
        })

        // get a particular user
        app.get("/users/single", async (req, res) => {

            const particularUser = await userCollection.findOne({ email: req.query.email });
            res.json(particularUser);
        })

        // confirming does the logged in user is admin or not
        app.get("/users/admin", async (req, res) => {
            const email = req.query.email;
            const particularUser = await userCollection.findOne({ email: email });


            let isAdmin = false;
            if (particularUser?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // make a user admin
        app.put("/users", async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const options = { upsert: false };
            const updateDoc = { $set: { role: "admin" } };
            const newAdmin = await userCollection.updateOne(filter, updateDoc, options);
            res.json(newAdmin);

        })

        // post a new user in database
        app.post("/users", async (req, res) => {

            const newUser = await userCollection.insertOne(req.body);
            res.json(newUser);
        })

        // post a new product
        app.post("/sedans", async (req, res) => {
            const newSedan = await sedanCollection.insertOne(req.body);
            res.json(newSedan);
        })

        // post a parchased item
        app.post('/purchasedSedan', async (req, res) => {
            const body = req.body;
            const result = await purchasedSedanCollection.insertOne(body);
            res.json(result);
        })

        // post a review
        app.post("/testimonials", async (req, res) => {
            const testimonial = await testimonialCollection.insertOne(req.body);
            res.json(testimonial);
        })

        // post a user who logged in using google
        app.put("/users", async (req, res) => {
            const filter = { email: req.body.email };
            const options = { upsert: true }
            const user = { $set: req.body };
            const result = await userCollection.updateOne(filter, user, options);
            res.json(result);
        })

        // update a purchased product shipping status
        app.put("/purchasedSedan/All/:id", async (req, res) => {
            const id = req.params.id;

            const query = { _id:  (id) };
            const updateDoc = { $set: { status: "shipped" } };
            const options = { upsert: false };
            const updatedStatus = await purchasedSedanCollection.updateOne(query, updateDoc, options);
            res.json(updatedStatus);
        })
        app.put("/purchasedSedan/paymentStatus/:id", async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId (id) };
            const updateDoc = { $set: { paymentStatus: "paid" } };
            const options = { upsert: true };
            const updatedStatus = await purchasedSedanCollection.updateOne(query, updateDoc, options);
            res.json(updatedStatus);
        })

        // delete a purchased item from admin pannel
        app.delete("/purchasedSedan/All/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const deletedOrder = await purchasedSedanCollection.deleteOne(query);
            res.json(deletedOrder);
        })

        // delete a product from admin pannel
        app.delete("/sedans/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id:new ObjectId(id) };
            const deletedSedan = await sedanCollection.deleteOne(query);
            res.json(deletedSedan);
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get("/", (req, res) => {

    res.json("Backend is working");
})
app.listen(port, () => {
    console.log("Listening to port ", port);
})
