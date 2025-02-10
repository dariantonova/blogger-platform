import {ConfirmationInfoType, UserDBType} from "../../../types/types";
import {UserModel} from "../../../db/db";

export class UsersRepository {
    async createUser(createdUser: UserDBType) {
        await UserModel.create(createdUser);
    };
    async findUserByLogin(login: string): Promise<UserDBType | null> {
        const filterObj: any = { isDeleted: false, login };
        return UserModel.findOne(filterObj, { _id: 0 }).lean();
    };
    async findUserByEmail(email: string): Promise<UserDBType | null> {
        const filterObj: any = { isDeleted: false, email };
        return UserModel.findOne(filterObj, { _id: 0 }).lean();
    };
    async findUserByLoginOrEmail(loginOrEmail: string): Promise<UserDBType | null> {
        const filterObj: any = {
            $and: [
                { isDeleted: false },
                { $or: [ { login: loginOrEmail }, { email: loginOrEmail } ] }
            ]
        };
        return UserModel.findOne(filterObj, { _id: 0 }).lean();
    };
    async findUserById(id: string): Promise<UserDBType | null> {
        const filterObj: any = { isDeleted: false, id };
        return UserModel.findOne(filterObj, { _id: 0 }).lean();
    };
    async findUserByConfirmationCode(confirmationCode: string): Promise<UserDBType | null> {
        const filterObj: any = {
            isDeleted: false,
            'confirmationInfo.confirmationCode': confirmationCode };
        return UserModel.findOne(filterObj, { _id: 0 }).lean();
    };
    async confirmUserRegistration(id: string) {
        const updateUserInfo = await UserModel.updateOne(
            { isDeleted: false, id },
            { 'confirmationInfo.isConfirmed': true }
        );

        return updateUserInfo.modifiedCount === 1;
    };
    async updateUserConfirmationInfo(id: string, confirmationInfo: ConfirmationInfoType) {
        const updateUserInfo = await UserModel.updateOne(
            { isDeleted: false, id },
            { confirmationInfo }
        );

        return updateUserInfo.modifiedCount === 1;
    };
    async deleteUser(id: string): Promise<boolean> {
        const updateUserInfo = await UserModel.updateOne(
            { isDeleted: false, id },
            { isDeleted: true }
        );

        return updateUserInfo.modifiedCount === 1;
    };
    async deleteAllUsers() {
        await UserModel.deleteMany({});
    };
}

export const usersRepository = new UsersRepository();