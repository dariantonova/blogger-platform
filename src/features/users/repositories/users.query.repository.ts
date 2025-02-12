import {Paginator, SortDirections, UserDBType} from "../../../types/types";
import {UserViewModel} from "../models/UserViewModel";
import {UserModel} from "../../../db/db";
import {injectable} from "inversify";

@injectable()
export class UsersQueryRepository {
    async findUsers(sortBy: string, sortDirection: SortDirections,
                    pageNumber: number, pageSize: number,
                    searchLoginTerm: string | null,
                    searchEmailTerm: string | null): Promise<Paginator<UserViewModel>> {
        const filterConditions: any[] = [
            { isDeleted: false }
        ];
        const filterObj: any = { $and: filterConditions };

        const searchTerms: any[] = [];
        if (searchLoginTerm || searchEmailTerm) {
            filterConditions.push({ $or: searchTerms });
        }

        if (searchLoginTerm) {
            searchTerms.push({
                login: { $regex: searchLoginTerm, $options: 'i' }
            });
        }

        if (searchEmailTerm) {
            searchTerms.push({
                email: { $regex: searchEmailTerm, $options: 'i' }
            });
        }

        const sortObj: any = {
            [sortBy]: sortDirection === SortDirections.ASC ? 1 : -1,
            _id: 1,
        };

        const foundUsers = await UserModel
            .find(filterObj, { _id: 0 })
            .sort(sortObj)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize)
            .lean();
        const totalCount = await this.countUsers(searchLoginTerm, searchEmailTerm);
        const pagesCount = Math.ceil(totalCount / pageSize);

        return this.createUsersPaginator(foundUsers, pageNumber, pageSize, pagesCount, totalCount);
    };
    async countUsers(searchLoginTerm: string | null,
                     searchEmailTerm: string | null): Promise<number> {
        const filterConditions: any[] = [
            { isDeleted: false }
        ];
        const filterObj: any = { $and: filterConditions };

        const searchTerms: any[] = [];
        if (searchLoginTerm || searchEmailTerm) {
            filterConditions.push({ $or: searchTerms });
        }

        if (searchLoginTerm) {
            searchTerms.push({
                login: { $regex: searchLoginTerm, $options: 'i' }
            });
        }

        if (searchEmailTerm) {
            searchTerms.push({
                email: { $regex: searchEmailTerm, $options: 'i' }
            });
        }

        return UserModel.countDocuments(filterObj);
    };
    async findUserById(id: string): Promise<UserViewModel | null> {
        const filterObj: any = { isDeleted: false, id };
        const foundUser = await UserModel
            .findOne(filterObj, { _id: 0 }).lean();
        return foundUser ? this.mapToOutput(foundUser) : null;
    };
    async mapToOutput(dbUser: UserDBType): Promise<UserViewModel> {
        return new UserViewModel(
            dbUser.id,
            dbUser.login,
            dbUser.email,
            dbUser.createdAt.toISOString()
        );
    };
    async createUsersPaginator(items: UserDBType[], page: number, pageSize: number,
                               pagesCount: number, totalCount: number): Promise<Paginator<UserViewModel>> {
        const itemsViewModels = await Promise.all(
            items.map(this.mapToOutput)
        );

        return new Paginator<UserViewModel>(
            itemsViewModels,
            pagesCount,
            page,
            pageSize,
            totalCount
        );
    };
}