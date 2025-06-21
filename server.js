// Import required modules
const express = require("express"); // Express framework for building the server
const mongoose = require("mongoose"); // Mongoose for interacting with MongoDB
const bcrypt = require("bcryptjs"); // Library for hashing passwords
const jwt = require("jsonwebtoken"); // JSON Web Token for authentication
const bodyParser = require("body-parser"); // Middleware to parse request bodies
const cors = require("cors"); // Middleware to enable Cross-Origin Resource Sharing
const http = require("http"); // Required for Socket.io
const { Server } = require("socket.io");

// Load the JWT secret key from the .env file
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

// Create an Express application
const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (modify for security in production)
        methods: ["GET", "POST"],
    },
});
// Define the server port (use environment variable or default to 5000)
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(bodyParser.json({ limit: "100mb" })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cors());

// Connect to MongoDB database
mongoose.connect("mongodb://localhost:27017/ichat", {
    useNewUrlParser: true, // Use the new MongoDB URL parser
    useUnifiedTopology: true, // Use the new topology engine
});

// Define a schema (structure) for users in the database
const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // User's name (required)
    password: { type: String, required: true }, // Hashed password (required)
});

// Create a Mongoose model based on the schema
const User = mongoose.model("User", userSchema);

// Route for user registration
app.post("/register", async (req, res) => {
    const { name, password } = req.body; // Get name and password from request body

    // Check if both fields are provided
    if (!name || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ name });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password
    const newUser = new User({
        name,
        password: hashedPassword,
    });

    // Save the new user to the database
    await newUser.save();

    // Respond with a success message
    res.status(201).json({ message: "User registered successfully" });
});

// Route for user login
app.post("/login", async (req, res) => {
    const { name, password } = req.body; // Get name and password from request body

    // Check if both fields are provided
    if (!name || !password) {
        return res.status(400).json({ message: "Please enter all fields" });
    }

    // Find the user in the database
    const user = await User.findOne({ name });
    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token for authentication
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    // Respond with the token and user details
    res.json({ token, user: { id: user._id, name: user.name } });
});

// Define the message schema (structure for messages in the database)
const messageSchema = new mongoose.Schema({
    text: { type: String, required: true }, // Message text (required field)
    user: { type: String, default: "Anonymous" }, // Username (defaults to "Anonymous")
    createdAt: { type: Date, default: Date.now }, // Timestamp (defaults to current time)
});

// Create a Mongoose model based on the schema (used to interact with the "messages" collection)
const Message = mongoose.model("Message", messageSchema);

// Fetch messages (GET request handler)
app.get("/messages", async (req, res) => {
    // Retrieve all messages from the database, sorted by creation time in descending order (newest first)
    const messages = await Message.find().sort({ createdAt: 1 });

    // Send the retrieved messages as a JSON response
    res.json(messages);
});

// Post a new message (POST request handler)
app.post("/messages", async (req, res) => {
    const { text, user } = req.body; // Extract the message text from the request body

    // Create a new message instance with the extracted text
    const newMessage = new Message({ text, user });

    // Save the new message to the database
    await newMessage.save();

    // Emit message to all connected clients
    io.emit("message", newMessage);

    // Send the newly created message as a JSON response
    res.json(newMessage);
});

// delete a message (DELETE request hadnler)
app.delete("/messages/:id", async (req, res) => {
    const messageId = req.params.id;

    try {
        const deletedMessage = await Message.findByIdAndDelete(messageId);
        if(deletedMessage) {
            res.status(200).send({message: "Message deleted successfully"});
        }
        else {
            res.status(404).send({message: "Message not found"});
        }
    } catch(error) {
        res.status(500).send({message: "Error deleting message"});
    }
});

app.patch("/messages/:id", async (req, res) => {
    const messageId = req.params.id;
    const { text } = req.body; // Get the updated text from the request body

    try {
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            { text },
            { new: true } // Return the updated document
        );
        if(updatedMessage) {
            res.status(200).send({message: "Message edited successfully"});
        }
        else {
            res.status(404).send({message: "Message not found"});
        }
    } catch(error) {
        res.status(500).send({message: "Error editing message"});
    }
});

// Start the server with Socket.io
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
