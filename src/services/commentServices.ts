import {
    getCookie,
    getSignedCookie,
    setCookie,
    setSignedCookie,
    deleteCookie,
} from "hono/cookie";
import { getAvatarFromEmail } from "../utils";
import { Comment } from "../models/commentModels";
import { Context } from "hono";
import { v4 as uuidv4 } from "uuid";

const checkDuplicateComment = async (
    c: Context,
    post_id: string,
    comment_author_email: string,
    comment_content: string
) => {
    const stmt = await c.env.DB.prepare(
        "SELECT * FROM comments WHERE post_id = ? AND comment_author_email = ? AND comment_content = ?"
    ).bind(post_id, comment_author_email, comment_content);

    return await stmt.all();
};

export const honoNewComment = async (c: Context, params: any) => {
    const {
        post_id,
        comment_author_name,
        comment_author_email,
        comment_author_url,
        comment_date,
        comment_content,
        comment_parent,
    } = params;
    const comment_id = uuidv4();

    const duplicate = await checkDuplicateComment(
        c,
        post_id,
        comment_author_email,
        comment_content
    );

    console.log(duplicate);

    if (duplicate.length > 0) {
        return c.json({ err: "Duplicate comment" }, 400);
    }

    // get comment auhor ip

    const comment_author_ip = c.req.raw.headers.get("CF-Connecting-IP");

    try {
        await c.env.DB.prepare(
            "INSERT INTO comments (comment_id, post_id, comment_author_name, comment_author_email, comment_author_url, comment_date, comment_content, comment_parent, comment_author_ip) VALUES (?, ?, ?, ?, ?, ?, ?, ? , ?)"
        )
            .bind(
                comment_id,
                post_id,
                comment_author_name,
                comment_author_email,
                comment_author_url,
                comment_date,
                comment_content,
                comment_parent,
                comment_author_ip
            )
            .run();
        // @ts-ignore
        const comment = await c.env.DB.prepare<Comment>(
            "SELECT * FROM comments WHERE comment_id = ?"
        )
            .bind(comment_id)
            .first();
        comment.avatar = getAvatarFromEmail(comment.comment_author_email);
        delete comment.comment_author_email;
        delete comment.comment_author_ip;
        setCookie(c, "comment_author_name", comment_author_name, {
            maxAge: 60 * 60 * 24 * 7,
            httpOnly: true,
            secure: true,
            domain: "localhost",
        });
        setCookie(c, "comment_author_email", comment_author_email);
        setCookie(c, "comment_author_url", comment_author_url);

        console.log(getCookie(c, "comment_author_name"));

        return c.json({ data: comment, status: 200 });
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
};

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
            delete childComment.comment_author_ip;
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

export const honoGetComments = async (
    c: Context,
    post_id: string,
    paged: number
) => {
    const stmt = await c.env.DB.prepare(
        "SELECT COUNT(*) AS total FROM comments WHERE post_id = ?"
    ).bind(post_id);
    const total = await stmt.first("total");
    const total_paged = Math.ceil(total / c.env.PAGESIZE);

    //@ts-ignore
    const objects = await c.env.DB.prepare(
        "SELECT * FROM comments WHERE post_id = ? AND comment_parent = '' ORDER BY comment_date ASC LIMIT ? OFFSET ? "
    )
        .bind(post_id, c.env.PAGESIZE, (total_paged - paged) * c.env.PAGESIZE)
        .all<Comment>();

    for (const object of objects.results) {
        object.children = await getChildComments(c, object.comment_id, post_id);
        object.avatar = getAvatarFromEmail(object.comment_author_email);
        delete object.comment_author_ip;
        delete object.comment_author_email;
    }

    // reverse results

    const results = objects.results;

    return c.json({ results, total, total_paged });
};
