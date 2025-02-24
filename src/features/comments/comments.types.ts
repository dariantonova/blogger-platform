import {LikesInfo, LikesInfoViewModel} from "../likes/likes.types";

export type CreateCommentInputModel = {
    content: string,
};

export type UpdateCommentInputModel = {
    content: string,
};

export class CommentatorInfo {
    constructor(public userId: string,
                public userLogin: string
    ) {}
}

export class CommentDBType {
    constructor(public content: string,
                public postId: string,
                public commentatorInfo: CommentatorInfo,
                public likesInfo: LikesInfo,
                public createdAt: string,
                public isDeleted: boolean
    ) {}
}

export class CommentType {
    constructor(public id: string,
                public content: string,
                public postId: string,
                public commentatorInfo: CommentatorInfo,
                public likesInfo: LikesInfo,
                public createdAt: string
    ) {}
}

export class CommentViewModel {
    constructor(public id: string,
                public content: string,
                public commentatorInfo: CommentatorInfo,
                public likesInfo: LikesInfoViewModel,
                public createdAt: string
    ) {}
}

export type URIParamsCommentIdModel = {
    id: string,
};

export type UpdateCommentLikeInfo = {
    matched: boolean,
    modified: boolean,
};