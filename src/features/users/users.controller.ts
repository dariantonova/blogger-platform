import {APIErrorResult, Paginator, RequestWithBody, RequestWithParams, RequestWithQuery} from "../../types/types";
import {QueryUsersModel} from "./models/QueryUsersModel";
import {UserViewModel} from "./models/UserViewModel";
import {Response} from "express";
import {validationResult} from "express-validator";
import {getUsersQueryParamsValues} from "../../helpers/query-params-values";
import {usersQueryRepository} from "./repositories/users.query.repository";
import {CreateUserInputModel} from "./models/CreateUserInputModel";
import {usersService} from "./users.service";
import {HTTP_STATUSES} from "../../utils";
import {URIParamsUserIdModel} from "./models/URIParamsUserIdModel";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";

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
    createUser: async (req: RequestWithBody<CreateUserInputModel>,
                       res: Response<UserViewModel | APIErrorResult>) => {
        const createUserResult = await usersService.createUser(
            req.body.login, req.body.email, req.body.password, true
        );

        if (createUserResult.status !== ResultStatus.SUCCESS) {
            const error: APIErrorResult = {
                errorsMessages: createUserResult.extensions,
            };
            res
                .status(resultStatusToHttp(createUserResult.status))
                .json(error);
            return;
        }

        const createdUserId = createUserResult.data as string;
        const createdUser = await usersQueryRepository.findUserById(createdUserId);
        if (!createdUser) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdUser);
    },
    deleteUser: async (req: RequestWithParams<URIParamsUserIdModel>, res: Response) => {
        const isDeleted = await usersService.deleteUser(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    },
};