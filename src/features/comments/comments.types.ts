export type CommentInputModel = {
    content: string,
};

export type CommentatorInfo = {
    userId: string,
    userLogin: string,
};

export type CommentType = {
    id: string,
    content: string,
    postId: string,
    commentatorInfo: CommentatorInfo,
    createdAt: string,
};

export type CommentViewModel = {
    id: string,
    content: string,
    commentatorInfo: CommentatorInfo,
    createdAt: string,
};