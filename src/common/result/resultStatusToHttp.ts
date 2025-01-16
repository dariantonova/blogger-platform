import {ResultStatus} from "./resultStatus";
import {HTTP_STATUSES} from "../../utils";

export const resultStatusToHttp = (resultStatus: ResultStatus): HTTP_STATUSES => {
    switch (resultStatus) {
        case ResultStatus.SUCCESS:
            return HTTP_STATUSES.OK_200;
        case ResultStatus.BAD_REQUEST:
            return HTTP_STATUSES.BAD_REQUEST_400;
        case ResultStatus.NOT_FOUND:
            return HTTP_STATUSES.NOT_FOUND_404;
        case ResultStatus.UNAUTHORIZED:
            return HTTP_STATUSES.UNAUTHORIZED_401;
        case ResultStatus.FORBIDDEN:
            return HTTP_STATUSES.FORBIDDEN_403;
        case ResultStatus.INTERNAL_SERVER_ERROR:
            return HTTP_STATUSES.INTERNAL_SERVER_ERROR_500;
    }
};