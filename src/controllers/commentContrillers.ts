import { Context } from "hono";
import { encodeForHTML, checkStringLength } from "../utils";
import { isEmail, isURL } from "../utils/validator";
import { honoNewComment, honoGetComments } from "../services";

export const getComments = async (c: Context) => {
    const post_id: string = c.req.query("post_id") || "";
    const paged: number = parseInt(c.req.query("paged") || "1");
    if (!post_id) {
        return c.json({ err: "post_id is required" }, 400);
    }
    return honoGetComments(c, post_id, paged);
};

export const inserComment = async (c: Context) => {
    const body = await c.req.json();
    const post_id: string = body.post_id || "";
    const comment_author_name: string = body.comment_author_name || "";
    const comment_author_email: string = body.comment_author_email || "";
    const comment_author_url: string = body.comment_author_url || "";
    let comment_content: string = body.comment_content || "";
    const comment_parent: string = body.comment_parent || "";
    // local date utc+8
    let comment_date: string = new Date().toLocaleString();
    comment_content = encodeForHTML(comment_content);

    if (!post_id) {
        return c.json({ err: "post_id is required" }, 400);
    }

    if (!isEmail(comment_author_email)) {
        return c.json({ err: "email is invalid" }, 400);
    }

    if (!comment_content) {
        return c.json({ err: "comment_content is required" }, 400);
    }

    if (!checkStringLength(comment_author_name, 1, 20)) {
        return c.json({ err: "comment_author_name is invalid" }, 400);
    }

    return honoNewComment(c, {
        post_id,
        comment_author_name,
        comment_author_email,
        comment_author_url,
        comment_date,
        comment_content,
        comment_parent,
    });
};
