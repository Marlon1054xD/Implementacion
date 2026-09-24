const express = require("express");
const app = express();
app.use(express.json());

let users = [
  { id: "U1", name: "Alex", warnings: 0, status: "active" },
  { id: "U2", name: "Sam", warnings: 2, status: "active" },
];

const bannedWords = ["violencia", "fraude", "spam"];

const ChatModel = {
  getUser: (id) => users.find((u) => u.id === id),
  updateUser: (id, updates) => {
    let user = users.find((u) => u.id === id);
    Object.assign(user, updates);
    return user;
  },
};

const ChatService = {
  sendMessage: (userId, message) => {
    const user = ChatModel.getUser(userId);
    if (!user) throw new Error("Usuario inválido");
    if (user.status === "banned")
      throw new Error("Usuario bloqueado permanentemente");

    const containsBanned = bannedWords.some((word) =>
      message.toLowerCase().includes(word),
    );

    if (containsBanned) {
      user.warnings += 1;

      if (user.warnings >= 3) {
        user.status = "banned";
      }
      ChatModel.updateUser(userId, user);
      throw new Error("Mensaje bloqueado por moderación automática");
    }

    return { status: "sent", message };
  },
};

const ChatController = {
  postMessage: (req, res) => {
    try {
      const result = ChatService.sendMessage(req.body.userId, req.body.message);
      res.status(200).json(result);
    } catch (error) {
      res.status(403).json({ error: error.message });
    }
  },
};

app.post("/api/chat/message", ChatController.postMessage);

module.exports = { app, ChatService, ChatModel };