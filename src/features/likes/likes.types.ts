import {LikeStatus} from "../../types/types";

export type LikesInfo = {
    likesCount: number,
    dislikesCount: number,
};

export type LikeDetails = {
    description: string,
    addedAt: Date,
    userId: string,
    login: string,
};

export type ExtendedLikesInfo = {
    likesCount: number,
    dislikesCount: number,
    newestLikes: LikeDetails[],
};

export class LikesInfoViewModel {
    constructor(public likesCount: number,
                public dislikesCount: number,
                public myStatus: LikeStatus,
    ) {}
}

export type LikeDetailsViewModel = {
    description: string,
    addedAt: Date,
    userId: string,
    login: string,
};

export type ExtendedLikesInfoViewModel = {
    likesCount: number,
    dislikesCount: number,
    myStatus: LikeStatus,
    newestLikes: LikeDetailsViewModel[],
};

export type LikeInputModel = {
    likeStatus: LikeStatus,
};