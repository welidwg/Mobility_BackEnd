const express = require("express");
const app = express();
const port = 3000;
const host = "192.168.1.16";
const bodyParser = require("body-parser");
const cors = require("cors");

//make sure we can get data as json from req.body
app.use(bodyParser.json());
app.use(express.json());

//allow the server to respond to requests from different domains
app.use(cors());

//firebase configuration
var admin = require("firebase-admin");
var serviceAccount = require("./conf.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

//routing

//Adding new distance traveled
app.post("/add-travel", async (req, res) => {
  const { userId, travel } = req.body; //recover the user id and travel data (mean of transport , kms , etc..)
  if (!userId || !travel) {
    return res.status(400).send("User ID and travel are required"); // ccheck ifthe data is available
  }
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).send("User not found"); // check if user document is already exists
    }
    const travelsRef = userRef.collection("travels"); // move to travels collection of the current user
    const docRef = await travelsRef.add(travel); // now add the new travel
    res.send({ success: 1, message: "Added successfully" });
  } catch (error) {
    console.error("Error : ", error);
    res.status(500).send({ success: 0, message: error });
  }
});

//get user data by user id
app.get("/user/:id", async (req, res) => {
  const id = req.params.id; //get the id from params
  const docRef = db.collection("users").doc(id);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    //proceed only if the document with user id exists
    const userData = docSnap.data();
    const travelsRef = docSnap.ref.collection("travels");
    const travelsSnapshot = await travelsRef.get();
    const travels = travelsSnapshot.docs.map((travelDoc) => travelDoc.data()); //get all the travels of the current user

    res.send({ ...userData, travels: travels.length > 0 ? travels : [] }); //send the user data appended with travels data
  } else {
    //handle user not found
    console.log("No such document!");
    res.status(404).send("No such user");
  }
});

app.listen(port, host, () => {
  console.log(`Serveur en écoute sur ${port}`);
});
