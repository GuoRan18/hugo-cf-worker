export interface Comment {
    comment_id: string;
    post_id: string;
    comment_author_name: string;
    comment_author_email: string;
    comment_date: any;
    comment_author_url: string;
    comment_author_ip: string;
    comment_content: string;
    comment_parent: string;
    children?: Comment[];
}
