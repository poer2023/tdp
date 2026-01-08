type Translations = Record<string, string>;

const translations: Record<string, Translations> = {
    en: {
        likes: "likes",
        comments: "Comments",
        noComments: "No comments yet",
        writeComment: "Write a comment...",
        loginToComment: "Login to comment",
        send: "Send",
        viewComments: "View comments",
    },
    zh: {
        likes: "赞",
        comments: "评论",
        noComments: "暂无评论",
        writeComment: "写下你的评论...",
        loginToComment: "登录后评论",
        send: "发送",
        viewComments: "查看评论",
    },
};

export function getMomentDetailTranslation(locale: string, key: string): string {
    return translations[locale]?.[key] || key;
}
