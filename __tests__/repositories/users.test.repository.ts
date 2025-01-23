import {usersCollection} from "../../src/db/db";
import {UserDBType} from "../../src/types/types";

export const usersTestRepository = {
    async findUserById(id: string): Promise<UserDBType | null> {
        const filterObj = { isDeleted: false, id: id };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
    async findUserByConfirmationCode(confirmationCode: string): Promise<UserDBType | null> {
        const filterObj: any = {
            isDeleted: false,
            'confirmationInfo.confirmationCode': confirmationCode };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
};