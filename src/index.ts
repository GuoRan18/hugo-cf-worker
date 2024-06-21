import { Hono } from "hono";
import comment from "./routers/commentRouters";
import post from "./routers/postRouters";
import theme from "./routers/themeRouters";
import { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.route("/comment", comment);
app.route("/post", post);
app.route("/", theme);

export default app;
