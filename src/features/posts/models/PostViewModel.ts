import {ExtendedLikesInfoViewModel} from "../../likes/likes.types";

export class PostViewModel {
    constructor(public id: string,
                public title: string,
                public shortDescription: string,
                public content: string,
                public blogId: string,
                public blogName: string,
                public createdAt: string,
                public extendedLikesInfo: ExtendedLikesInfoViewModel,
    ) {}
}