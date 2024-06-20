import { Comment } from "../models/commentModels";
import { Context } from "hono";
import { v4 as uuidv4 } from "uuid";
import { encodeForHTML, getAvatarFromEmail } from "../utils";
import { isEmail, isURL } from "../utils/validator";

const getChildComments = async (
    c: Context,
    comment_id: string,
    post_id: string
): Promise<Comment[]> => {
    //@ts-ignore
    const childComments = await c.env.DB.prepare<Comment>(
        "SELECT * FROM comments WHERE comment_parent = ? AND post_id = ? ORDER BY comment_date DESC"
    )
        .bind(comment_id, post_id)
        .all();

    let result = [];
    const comment_results = Array.isArray(childComments.results);
    if (comment_results) {
        for (const childComment of childComments.results) {
            childComment.avatar = getAvatarFromEmail(
                childComment.comment_author_email
            );
            delete childComment.comment_author_email;
            console.log(childComment);
            result.push({
                ...childComment,
            });
            const children = await getChildComments(
                c,
                childComment.comment_id,
                post_id
            );
            result = result.concat(children);
        }
    }
    return result;
};

export const getComments = async (c: Context) => {
    const post_id: string = c.req.query("post_id") || "";
    const paged: number = parseInt(c.req.query("paged") || "1");
    if (!post_id) {
        return c.json({ err: "post_id is required" }, 400);
    }
    //@ts-ignore
    const objects = await c.env.DB.prepare(
        "SELECT * FROM comments WHERE post_id = ? AND comment_parent = '' ORDER BY comment_date DESC LIMIT ? OFFSET ? "
    )
        .bind(post_id, c.env.PAGESIZE, (paged - 1) * c.env.PAGESIZE)
        .all<Comment>();

    const stmt = await c.env.DB.prepare(
        "SELECT COUNT(*) AS total FROM comments WHERE post_id = ?"
    ).bind(post_id);
    const total = await stmt.first("total");
    const total_paged = Math.ceil(total / c.env.PAGESIZE);
    for (const object of objects.results) {
        object.children = await getChildComments(c, object.comment_id, post_id);
        object.avatar = getAvatarFromEmail(object.comment_author_email);
        // drop email prop
        delete object.comment_author_email;
    }
    return c.json({ results: objects.results, total, total_paged });
};

export const inserComment = async (c: Context) => {
    const body = await c.req.json();
    const post_id: string = body.post_id || "";
    const comment_author_name: string = body.comment_author_name || "";
    const comment_author_email: string = body.comment_author_email || "";
    const comment_author_url: string = body.comment_author_url || "";
    let comment_content: string = body.comment_content || "";
    const comment_parent: string = body.comment_parent || "";
    const comment_date: string = new Date().toISOString();
    const comment_id = uuidv4();
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

    try {
        await c.env.DB.prepare(
            "INSERT INTO comments (comment_id, post_id, comment_author_name, comment_author_email, comment_author_url, comment_date, comment_content, comment_parent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
            .bind(
                comment_id,
                post_id,
                comment_author_name,
                comment_author_email,
                comment_author_url,
                comment_date,
                comment_content,
                comment_parent
            )
            .run();
        // @ts-ignore
        const comment = await c.env.DB.prepare<Comment>(
            "SELECT * FROM comments WHERE comment_id = ?"
        )
            .bind(comment_id)
            .first();
        return c.json({ data: comment, status: 200 });
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
};
