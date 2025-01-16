export type CreateCommentInputModel = {
    content: string,
};

export type UpdateCommentInputModel = {
    content: string,
};

export type CommentatorInfo = {
    userId: string,
    userLogin: string,
};

export type CommentDBType = {
    content: string,
    postId: string,
    commentatorInfo: CommentatorInfo,
    createdAt: string,
    isDeleted: boolean,
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

export type URIParamsCommentIdModel = {
    id: string,
};