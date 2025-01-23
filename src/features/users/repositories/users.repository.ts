import {ConfirmationInfoType, UserDBType} from "../../../types/types";
import {usersCollection} from "../../../db/db";

export const usersRepository = {
    async createUser(createdUser: UserDBType) {
        await usersCollection.insertOne(createdUser);
    },
    async findUserByLogin(login: string): Promise<UserDBType | null> {
        const filterObj: any = { isDeleted: false, login: login };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
    async findUserByEmail(email: string): Promise<UserDBType | null> {
        const filterObj: any = { isDeleted: false, email: email };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
    async findUserByLoginOrEmail(loginOrEmail: string): Promise<UserDBType | null> {
        const filterObj: any = {
            $and: [
                { isDeleted: false },
                { $or: [ { login: loginOrEmail }, { email: loginOrEmail } ] }
            ]
        };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
    async findUserById(id: string): Promise<UserDBType | null> {
        const filterObj: any = { isDeleted: false, id: id };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
    async findUserByConfirmationCode(confirmationCode: string): Promise<UserDBType | null> {
        const filterObj: any = {
            isDeleted: false,
            'confirmationInfo.confirmationCode': confirmationCode };
        return usersCollection.findOne(filterObj, { projection: { _id: 0 } });
    },
    async confirmUserRegistration(id: string) {
        const updateUserInfo = await usersCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { 'confirmationInfo.isConfirmed': true } }
        );

        return updateUserInfo.modifiedCount === 1;
    },
    async updateUserConfirmationInfo(id: string, confirmationInfo: ConfirmationInfoType) {
        const updateUserInfo = await usersCollection.updateOne(
            { isDeleted: false, id },
            { $set: { confirmationInfo } }
        );

        return updateUserInfo.modifiedCount === 1;
    },
    async deleteUser(id: string): Promise<boolean> {
        const updateUserInfo = await usersCollection.updateOne(
            { isDeleted: false, id: id },
            { $set: { isDeleted: true } }
        );

        return updateUserInfo.modifiedCount === 1;
    },
    async deleteAllUsers() {
        await usersCollection.drop();
    },
};