CREATE TABLE IF NOT EXISTS articles (post_id TEXT PRIMARY KEY, likes INTEGER, views INTEGER);
CREAtE TABLE IF NOT EXISTS comments (comment_id TEXT PRIMARY KEY, post_id TEXT, comment TEXT , comment_author_name TEXT, comment_author_email TEXT, comment_author_url TEXT, comment_author_ip TEXT, comment_date TEXT, comment_content TEXT, comment_parent TEXT, comment_likes INTEGER, comment_dislikes INTEGER);
CREATE TABLE IF NOT EXISTS themes (name TEXT PRIMARY KEY, version TEXT);