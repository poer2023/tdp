import type { FeedMoment } from "../feed";

export interface MomentComment {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

export interface MomentDetailProps {
    moment: FeedMoment;
    onClose: () => void;
    onLike?: (id: string) => Promise<{ liked: boolean; likeCount: number } | void> | void;
}
