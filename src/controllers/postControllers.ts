import { Context } from "hono";
import { ArticleRow } from "../models";

export const getPostsViews = async (c: Context) => {
    let post_ids: any = c.req.query("post_ids") || "";
    post_ids = post_ids.split(",");
    post_ids = post_ids.map((id: string) => {
        return `'${id}'`;
    });
    post_ids = post_ids.join(",");
    try {
        // @ts-ignore
        let result = await c.env.DB.prepare(
            "SELECT * FROM articles WHERE post_id IN (" + post_ids + ")"
        ).all<ArticleRow>();
        return c.json(result);
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
};

export const getPostLike = async (c: Context) => {
    const post_id = c.req.param("key");
    try {
        // @ts-ignore
        let article = await c.env.DB.prepare(
            "SELECT * FROM articles WHERE post_id = ?"
        )
            .bind(post_id)
            .first<ArticleRow>();
        if (!article) {
            return c.json({ likes: 0 });
        } else {
            return c.json({ likes: article.likes });
        }
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
};

export const getPostView = async (c: Context) => {
    const post_id = c.req.param("key");
    try {
        // @ts-ignore
        let article = await c.env.DB.prepare(
            "SELECT * FROM articles WHERE post_id = ?"
        )
            .bind(post_id)
            .first<ArticleRow>();
        if (!article) {
            return c.json({ views: 0 });
        } else {
            return c.json({ views: article.views });
        }
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
};

export const updatePostView = async (c: Context) => {
    const post_id = c.req.param("key");
    try {
        let views: number = 0;

        // @ts-ignore
        let article = await c.env.DB.prepare(
            "SELECT * FROM articles WHERE post_id = ?"
        )
            .bind(post_id)
            .first<ArticleRow>();
        if (!article) {
            await c.env.DB.prepare(
                "INSERT INTO articles (post_id, views) VALUES (?, ?)"
            )
                .bind(post_id, 1)
                .run();
            views = 1;
        } else {
            await c.env.DB.prepare(
                "UPDATE articles SET views = ? WHERE post_id = ?"
            )
                .bind(article.views + 1, post_id)
                .run();
            views = article.views + 1;
        }

        return c.json({ views });
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
};

export const updatePostLike = async (c: Context) => {
    const post_id = c.req.param("key");
    try {
        let likes: number = 0;
        // @ts-ignore
        let article = await c.env.DB.prepare(
            "SELECT * FROM articles WHERE post_id = ?"
        )
            .bind(post_id)
            .first<ArticleRow>();
        if (!article) {
            await c.env.DB.prepare(
                "INSERT INTO articles (post_id, likes) VALUES (?, ?)"
            )
                .bind(post_id, 1)
                .run();
            likes = 1;
        } else {
            await c.env.DB.prepare(
                "UPDATE articles SET likes = ? WHERE post_id = ?"
            )
                .bind(article.likes + 1, post_id)
                .run();
            likes = article.likes + 1;
        }

        return c.json({ likes });
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
};
