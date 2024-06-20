import { Hono } from "hono";
import comment from "./routers/commentRouters";
import post from "./routers/postRouters";
import { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/comment", comment);
app.route("/post", post);

export default app;
