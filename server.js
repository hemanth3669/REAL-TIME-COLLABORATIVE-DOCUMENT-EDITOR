const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend to connect
    methods: ["GET", "POST"],
  },
});

// MongoDB Connection


mongoose
  .connect(process.env.MONGO_URI) // Remove deprecated options
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));


// Define Schema & Model
const DocumentSchema = new mongoose.Schema({ content: String });
const Document = mongoose.model("Document", DocumentSchema);

io.on("connection", (socket) => {
  console.log(`⚡ User Connected: ${socket.id}`);

  socket.on("get-document", async (docId) => {
    let document = await Document.findById(docId);
    if (!document) {
      document = new Document({ _id: docId, content: "" });
      await document.save();
    }
    socket.join(docId);
    socket.emit("load-document", document.content);
  });

  socket.on("textChange", async ({ docId, content }) => {
    await Document.findByIdAndUpdate(docId, { content });
    socket.to(docId).emit("updateText", content);
  });

  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => console.log("🚀 Server running on port 5000"));
