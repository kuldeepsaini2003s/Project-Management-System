import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";
import { initSocket } from "./config/socket.js";
import AuthRoute from "./routes/AuthRoute.js";
import UserRoute from "./routes/UserRoute.js";
import WorkspaceRoute from "./routes/WorkspaceRoute.js";
import TeamRoute from "./routes/TeamRoute.js";
import ProjectRoute from "./routes/ProjectRoute.js";
import IssueRoute from "./routes/IssueRoute.js";
import LabelRoute from "./routes/LabelRoute.js";
import CommentRoute from "./routes/CommentRoute.js";
import JoinRequestRoute from "./routes/JoinRequestRoute.js";
import InviteRoute from "./routes/InviteRoute.js";
import NotificationRoute from "./routes/NotificationRoute.js";
import WebhookRoute from "./routes/WebhookRoute.js";
import GithubRoute from "./routes/GithubRoute.js";
import SlackRoute from "./routes/SlackRoute.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { verifyEmailTransport } from "./services/EmailService.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://algofolks-linear-app.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(morgan("dev"));

// Webhooks need the raw body for signature verification — mount BEFORE express.json.
app.use("/api/webhooks", express.raw({ type: "*/*" }), WebhookRoute);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", AuthRoute);
app.use("/api/users", UserRoute);
app.use("/api/workspaces", WorkspaceRoute);
app.use("/api/teams", TeamRoute);
app.use("/api/projects", ProjectRoute);
app.use("/api/issues", IssueRoute);
app.use("/api/labels", LabelRoute);
app.use("/api/comments", CommentRoute);
app.use("/api/join-requests", JoinRequestRoute);
app.use("/api/invites", InviteRoute);
app.use("/api/notifications", NotificationRoute);
app.use("/api/github", GithubRoute);
app.use("/api/slack", SlackRoute);

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
  verifyEmailTransport();
});

export default app;
