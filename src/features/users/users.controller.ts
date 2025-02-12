import {APIErrorResult, Paginator, RequestWithBody, RequestWithParams, RequestWithQuery} from "../../types/types";
import {QueryUsersModel} from "./models/QueryUsersModel";
import {UserViewModel} from "./models/UserViewModel";
import {Response} from "express";
import {getUsersQueryParamsValues} from "../../helpers/query-params-values";
import {UsersQueryRepository} from "./repositories/users.query.repository";
import {CreateUserInputModel} from "./models/CreateUserInputModel";
import {UsersService} from "./users.service";
import {HTTP_STATUSES} from "../../utils";
import {URIParamsUserIdModel} from "./models/URIParamsUserIdModel";
import {ResultStatus} from "../../common/result/resultStatus";
import {resultStatusToHttp} from "../../common/result/resultStatusToHttp";
import {inject, injectable} from "inversify";

@injectable()
export class UsersController {
    constructor(
        @inject(UsersService) protected usersService: UsersService,
        @inject(UsersQueryRepository) protected usersQueryRepository: UsersQueryRepository
    ) {}

    async getUsers (req: RequestWithQuery<QueryUsersModel>,
                    res: Response<Paginator<UserViewModel>>) {
        const {
            sortBy,
            sortDirection,
            pageSize,
            pageNumber,
            searchLoginTerm,
            searchEmailTerm
        } = getUsersQueryParamsValues(req);

        const foundUsers = await this.usersQueryRepository.findUsers(
            sortBy, sortDirection, pageNumber, pageSize, searchLoginTerm, searchEmailTerm
        );

        res.json(foundUsers);
    };
    async createUser (req: RequestWithBody<CreateUserInputModel>,
                      res: Response<UserViewModel | APIErrorResult>) {
        const result = await this.usersService.createUser(
            req.body.login, req.body.email, req.body.password, true
        );

        if (result.status !== ResultStatus.SUCCESS) {
            const error = new APIErrorResult(result.extensions);
            res
                .status(resultStatusToHttp(result.status))
                .json(error);
            return;
        }

        const createdUserId = result.data as string;
        const createdUser = await this.usersQueryRepository.findUserById(createdUserId);
        if (!createdUser) {
            res.sendStatus(HTTP_STATUSES.INTERNAL_SERVER_ERROR_500);
            return;
        }

        res
            .status(HTTP_STATUSES.CREATED_201)
            .json(createdUser);
    };
    async deleteUser (req: RequestWithParams<URIParamsUserIdModel>, res: Response) {
        const isDeleted = await this.usersService.deleteUser(req.params.id);
        if (!isDeleted) {
            res.sendStatus(HTTP_STATUSES.NOT_FOUND_404);
            return;
        }

        res.sendStatus(HTTP_STATUSES.NO_CONTENT_204);
    };
}