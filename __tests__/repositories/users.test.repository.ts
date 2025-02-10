import {UserModel} from "../../src/db/db";
import {UserDBType} from "../../src/types/types";

class UsersTestRepository {
    async findUserById(id: string): Promise<UserDBType | null> {
        const filterObj = { isDeleted: false, id };
        return UserModel.findOne(filterObj, { _id: 0 }).lean();
    };
    async findUserByConfirmationCode(confirmationCode: string): Promise<UserDBType | null> {
        const filterObj: any = {
            isDeleted: false,
            'confirmationInfo.confirmationCode': confirmationCode };
        return UserModel.findOne(filterObj, { _id: 0 }).lean();
    };
}

export const usersTestRepository = new UsersTestRepository();