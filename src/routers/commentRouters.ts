import { Hono } from "hono";
import { cors } from "hono/cors";
import { getComments, inserComment } from "../controllers";
import { Bindings } from "../types";

const comment = new Hono<{ Bindings: Bindings }>();

comment.use(
    cors({
        origin: "*",
    })
);

comment.get("/list", (c) => getComments(c));

comment.post("/insert", (c) => inserComment(c));

export default comment;
