import {Paginator, RequestWithQuery} from "../../types";
import {QueryUsersModel} from "./models/QueryUsersModel";
import {UserViewModel} from "./models/UserViewModel";
import {Response} from "express";
import {validationResult} from "express-validator";
import {getUsersQueryParamsValues} from "../../helpers/query-params-values";
import {usersQueryRepository} from "./repositories/users.query.repository";

export const usersController = {
    getUsers: async (req: RequestWithQuery<QueryUsersModel>,
                     res: Response<Paginator<UserViewModel>>) => {
        const validationErrors = validationResult(req);
        if (!validationErrors.isEmpty()) {
            const output: Paginator<UserViewModel> = {
                pagesCount: 0,
                page: 0,
                pageSize: 0,
                totalCount: 0,
                items: [],
            };
            res.json(output);
            return;
        }

        const {
            sortBy,
            sortDirection,
            pageSize,
            pageNumber,
            searchLoginTerm,
            searchEmailTerm
        } = getUsersQueryParamsValues(req);

        const foundUsers = await usersQueryRepository.findUsers(
            sortBy, sortDirection, pageNumber, pageSize, searchLoginTerm, searchEmailTerm
        );

        res.json(foundUsers);
    },
};