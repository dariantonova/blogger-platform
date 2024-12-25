import {PostDBType, SortDirections} from "../../../types";
import {postsCollection} from "../../../db/db";

export const postsQueryRepository = {
    async findPosts(sortBy: string, sortDirection: string): Promise<PostDBType[]> {
        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        return await postsCollection
            .find({ isDeleted: false }, { projection: { _id: 0 } })
            .sort(sortObj)
            .toArray() as PostDBType[];
    },
    async findPostById(id: string): Promise<PostDBType | null> {
        return postsCollection.findOne({ isDeleted: false, id: id }, { projection: { _id: 0 } });
    },
};