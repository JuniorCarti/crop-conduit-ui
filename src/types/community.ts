export type MediaItem = {
  url: string;
  type: "image" | "video";
  key?: string;
  contentType?: string;
};

export type CommunityPost = {
  id: string;
  userId: string;
  authorName?: string | null;
  location?: string | null;
  crop?: string | null;
  text: string;
  tags: string[];
  createdAt: string;
  media: MediaItem[];
  counts: {
    likeCount: number;
    commentCount: number;
  };
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
};

export type CommunityComment = {
  id: string;
  postId: string;
  userId: string;
  authorName?: string | null;
  text: string;
  createdAt: string;
};

export type PagedResult<T> = {
  items: T[];
  nextCursor?: string | null;
};
