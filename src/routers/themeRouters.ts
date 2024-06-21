import { Hono } from "hono";
import { Bindings } from "../types";
import { bearerAuth } from "hono/bearer-auth";
const token = "bigfa";
const theme = new Hono<{ Bindings: Bindings }>();

theme.get("/latest", async (c) => {
    try {
        let result = await c.env.DB.prepare(
            "SELECT * FROM themes WHERE name = ?"
        )
            .bind("farallon")
            .first();
        return c.json(result);
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
});

theme.get("/update", bearerAuth({ token }), async (c) => {
    let version: any = c.req.query("version");
    // rm str refs/tags/v form version
    version = version.replace("refs/tags/v", "");
    try {
        await c.env.DB.prepare("UPDATE themes SET version = ? WHERE name = ?")
            .bind(version, "farallon")
            .run();
        return c.text("Updated");
    } catch (e) {
        console.log(e);
        return c.json({ err: e }, 500);
    }
});

export default theme;
