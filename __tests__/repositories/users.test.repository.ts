import {usersCollection} from "../../src/db/db";
import {UserDBType} from "../../src/types";

export const usersTestRepository = {
    async findUserById(id: string): Promise<UserDBType | null> {
        const filterObj = { isDeleted: false, id: id };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
};