import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb, setDb} from "../../src/db/db";
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {invalidAuthValues} from "../datasets/authorization-data";
import {userTestManager} from "../test-managers/user-test-manager";
import {usersQueryRepository} from "../../src/features/users/repositories/users.query.repository";
import {DEFAULT_QUERY_VALUES} from "../../src/helpers/query-params-values";
import {UserDBType} from "../../src/types/types";
import {invalidPageNumbers, invalidPageSizes} from "../datasets/validation/query-validation-data";
import {CreateUserInputModel} from "../../src/features/users/models/CreateUserInputModel";
import {validUserFieldInput} from "../datasets/validation/users-validation-data";
import {usersTestRepository} from "../repositories/users.test.repository";


describe('tests for /users', () => {
    let server: MongoMemoryServer;

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        const uri = server.getUri();

        const res = await runDb(uri);
        expect(res).toBe(true);

        await req
            .delete(SETTINGS.PATH.TESTING + '/all-data');
    });

    afterAll(async () => {
        await client.close();
        await server.stop();
    });

    describe('get users', () => {
        let initialDbUsers: UserDBType[];

        beforeAll(async () => {
            await setDb();
        });

        // bad auth
        it('should forbid getting users for non-admin users', async () => {
            // no auth
            await req
                .get(SETTINGS.PATH.USERS)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await userTestManager.getUsers(HTTP_STATUSES.UNAUTHORIZED_401,
                    '', invalidAuthValue);
            }
        });

        // empty array
        it('should return empty array', async () => {
            const expected = await usersQueryRepository.createUsersPaginator(
                [],
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                0,
                0,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200);
            expect(response.body).toEqual(expected);
        });

        // full array
        it('should return array with all users', async () => {
            initialDbUsers = [
                {
                    id: '1',
                    login: 'user1',
                    email: 'user1@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash1',
                    isDeleted: true,
                },
                {
                    id: '2',
                    login: 'user2',
                    email: 'user2@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash2',
                    isDeleted: false,
                },
                {
                    id: '3',
                    login: 'user3',
                    email: 'user3@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash3',
                    isDeleted: true,
                },
                {
                    id: '4',
                    login: 'user4',
                    email: 'user4@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash4',
                    isDeleted: false,
                },
            ];

            await setDb({ users: initialDbUsers });

            const expectedUsers = initialDbUsers.filter(u => !u.isDeleted);
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200);
            expect(response.body).toEqual(expected);
        });

        // search
        // login
        it('should return users with login containing search login term', async () => {
            initialDbUsers = [
                {
                    id: '1',
                    login: 'aba',
                    email: 'user1@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash1',
                    isDeleted: false,
                },
                {
                    id: '2',
                    login: 'user2',
                    email: 'miko@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash2',
                    isDeleted: false,
                },
                {
                    id: '3',
                    login: 'aBa',
                    email: 'miKo@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash3',
                    isDeleted: false,
                },
                {
                    id: '4',
                    login: 'user4',
                    email: 'user4@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash4',
                    isDeleted: false,
                },
                {
                    id: '5',
                    login: 'bacon',
                    email: 'user5@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash5',
                    isDeleted: true,
                },
                {
                    id: '6',
                    login: 'user6',
                    email: 'killua@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash6',
                    isDeleted: true,
                },
            ];

            await setDb({ users: initialDbUsers });

            const expectedUsers = [
                initialDbUsers[0], initialDbUsers[2]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'searchLoginTerm=b');
            expect(response.body).toEqual(expected);
        });

        // email
        it('should return users with email containing search email term', async () => {
            const expectedUsers = [
                initialDbUsers[1], initialDbUsers[2]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'searchEmailTerm=k');
            expect(response.body).toEqual(expected);
        });

        // login and email
        it('should return users with login containing search login term or email containing search email term',
            async () => {
            const expectedUsers = [
                initialDbUsers[0], initialDbUsers[1], initialDbUsers[2]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'searchLoginTerm=b&searchEmailTerm=k');
            expect(response.body).toEqual(expected);
        });

        // non-existing login and email
        it('should return empty array if no user matches search login term or search email term',
            async () => {
            const expectedUsers: UserDBType[] = [];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                0,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'searchLoginTerm=bad&searchEmailTerm=bad');
            expect(response.body).toEqual(expected);
        });

        // sort
        // createdAt desc
        it('should return users sorted by creation date in desc order', async () => {
            initialDbUsers = [
                {
                    id: '1',
                    login: 'aaUser',
                    email: 'aa@example.com',
                    createdAt: '2024-12-15T05:32:26.882Z',
                    passwordHash: 'hash1',
                    isDeleted: true,
                },
                {
                    id: '2',
                    login: 'b',
                    email: 'b@example.com',
                    createdAt: '2024-12-17T05:32:26.882Z',
                    passwordHash: 'hash2',
                    isDeleted: false,
                },
                {
                    id: '3',
                    login: 'cUser',
                    email: 'c@example.com',
                    createdAt: '2024-12-18T05:32:26.882Z',
                    passwordHash: 'hash3',
                    isDeleted: false,
                },
                {
                    id: '4',
                    login: 'abUser',
                    email: 'ab@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash4',
                    isDeleted: false,
                },
            ];

            await setDb({ users: initialDbUsers });

            const expectedUsers = [
                initialDbUsers[2], initialDbUsers[1], initialDbUsers[3]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response1 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=createdAt&sortDirection=desc');
            expect(response1.body).toEqual(expected);

            const response2 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=createdAt');
            expect(response2.body).toEqual(expected);

            const response3 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortDirection=desc');
            expect(response3.body).toEqual(expected);

            const response4 = await userTestManager.getUsers(HTTP_STATUSES.OK_200);
            expect(response4.body).toEqual(expected);
        });

        // createdAt asc
        it('should return users sorted by creation date in asc order', async () => {
            const expectedUsers = [
                initialDbUsers[3], initialDbUsers[1], initialDbUsers[2]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response1 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=createdAt&sortDirection=asc');
            expect(response1.body).toEqual(expected);

            const response2 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortDirection=asc');
            expect(response2.body).toEqual(expected);
        });

        // id desc
        it('should return users sorted by id in desc order', async () => {
            const expectedUsers = [
                initialDbUsers[3], initialDbUsers[2], initialDbUsers[1]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response1 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=id&sortDirection=desc');
            expect(response1.body).toEqual(expected);

            const response2 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=id');
            expect(response2.body).toEqual(expected);
        });

        // id asc
        it('should return users sorted by id in asc order', async () => {
            const expectedUsers = [
                initialDbUsers[1], initialDbUsers[2], initialDbUsers[3]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=id&sortDirection=asc');
            expect(response.body).toEqual(expected);
        });

        // login desc
        it('should return users sorted by login in desc order', async () => {
            const expectedUsers = [
                initialDbUsers[2], initialDbUsers[1], initialDbUsers[3]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response1 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=login&sortDirection=desc');
            expect(response1.body).toEqual(expected);

            const response2 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=login');
            expect(response2.body).toEqual(expected);
        });

        // login asc
        it('should return users sorted by login in asc order', async () => {
            const expectedUsers = [
                initialDbUsers[3], initialDbUsers[1], initialDbUsers[2]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=login&sortDirection=asc');
            expect(response.body).toEqual(expected);
        });

        // email desc
        it('should return users sorted by email in desc order', async () => {
            const expectedUsers = [
                initialDbUsers[2], initialDbUsers[1], initialDbUsers[3]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response1 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=email&sortDirection=desc');
            expect(response1.body).toEqual(expected);

            const response2 = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=email');
            expect(response2.body).toEqual(expected);
        });

        // email asc
        it('should return users sorted by email in asc order', async () => {
            const expectedUsers = [
                initialDbUsers[3], initialDbUsers[1], initialDbUsers[2]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=email&sortDirection=asc');
            expect(response.body).toEqual(expected);
        });

        // sort + search
        it('should return users with login containing search login term sorted by email in asc order',
            async () => {
            const expectedUsers = [
                initialDbUsers[3], initialDbUsers[2]
            ];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=email&sortDirection=asc&searchLoginTerm=user');
            expect(response.body).toEqual(expected);
        });

        // bad sort field
        it('should return users in the order of creation if specified sort field doesn\'t exist',
            async () => {
            const expectedUsers = initialDbUsers.slice(1);
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                DEFAULT_QUERY_VALUES.USERS.pageSize,
                1,
                expectedUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'sortBy=bad');
            expect(response.body).toEqual(expected);
        });

        // pagination
        // invalid pageNumber
        it('should return empty array if page number is invalid', async () => {
            initialDbUsers = [
                {
                    id: '1',
                    login: 'user1',
                    email: 'user1@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash1',
                    isDeleted: false,
                },
                {
                    id: '2',
                    login: 'user2',
                    email: 'user2@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash2',
                    isDeleted: false,
                },
                {
                    id: '3',
                    login: 'user3',
                    email: 'user3@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash3',
                    isDeleted: false,
                },
                {
                    id: '4',
                    login: 'user4',
                    email: 'user4@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash4',
                    isDeleted: false,
                },
                {
                    id: '5',
                    login: 'user5',
                    email: 'user5@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash5',
                    isDeleted: false,
                },
                {
                    id: '6',
                    login: 'user6',
                    email: 'user6@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash6',
                    isDeleted: false,
                },
                {
                    id: '7',
                    login: 'user7',
                    email: 'user7@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash7',
                    isDeleted: false,
                },
                {
                    id: '8',
                    login: 'user8',
                    email: 'user8@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash8',
                    isDeleted: false,
                },
                {
                    id: '9',
                    login: 'user9',
                    email: 'user9@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash9',
                    isDeleted: false,
                },
                {
                    id: '10',
                    login: 'user10',
                    email: 'user10@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash10',
                    isDeleted: false,
                },
                {
                    id: '11',
                    login: 'user11',
                    email: 'user11@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash11',
                    isDeleted: false,
                },
                {
                    id: '12',
                    login: 'user12',
                    email: 'user12@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash12',
                    isDeleted: false,
                },
                {
                    id: '13',
                    login: 'user13',
                    email: 'user13@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash13',
                    isDeleted: false,
                },
                {
                    id: '14',
                    login: 'user14',
                    email: 'user14@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash14',
                    isDeleted: false,
                },
                {
                    id: '15',
                    login: 'user15',
                    email: 'user15@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash15',
                    isDeleted: false,
                },
                {
                    id: '16',
                    login: 'user16',
                    email: 'user16@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash16',
                    isDeleted: false,
                },
                {
                    id: '17',
                    login: 'user17',
                    email: 'user17@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash17',
                    isDeleted: false,
                },
                {
                    id: '18',
                    login: 'user18',
                    email: 'user18@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash18',
                    isDeleted: false,
                },
                {
                    id: '19',
                    login: 'user19',
                    email: 'user19@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash19',
                    isDeleted: false,
                },
                {
                    id: '20',
                    login: 'user20',
                    email: 'user20@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash20',
                    isDeleted: false,
                },
                {
                    id: '21',
                    login: 'user21',
                    email: 'user21@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash21',
                    isDeleted: false,
                },
                {
                    id: '22',
                    login: 'user22',
                    email: 'user22@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash22',
                    isDeleted: false,
                },
                {
                    id: '23',
                    login: 'user23',
                    email: 'user23@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash23',
                    isDeleted: false,
                },
                {
                    id: '24',
                    login: 'user24',
                    email: 'user24@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash24',
                    isDeleted: false,
                },
            ];

            await setDb({ users: initialDbUsers });

            const expected = await usersQueryRepository.createUsersPaginator(
                [], 0, 0, 0, 0,
            );
            for (const invalidPageNumber of invalidPageNumbers) {
                const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                    'pageNumber=' + invalidPageNumber);
                expect(response.body).toEqual(expected);
            }
        });

        // invalid pageSize
        it('should return empty array if page size is invalid', async () => {
            const expected = await usersQueryRepository.createUsersPaginator(
                [], 0, 0, 0, 0,
            );
            for (const invalidPageSize of invalidPageSizes) {
                const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                    'pageNumber=' + invalidPageSize);
                expect(response.body).toEqual(expected);
            }
        });

        // invalid pageNumber and pageSize
        it('should return empty array if page number and page size are invalid',
            async () => {
            const invalidPageNumber = invalidPageNumbers[0];
            const invalidPageSize = invalidPageSizes[0];

            const expected = await usersQueryRepository.createUsersPaginator(
                [], 0, 0, 0, 0,
            );
            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'pageNumber=' + invalidPageNumber
                + '&pageSize=' + invalidPageSize);
            expect(response.body).toEqual(expected);
        });

        // pageNumber and pageSize defaults
        it('default page number and page size should be correct', async () => {
            const defaultPageSize = 10;
            const defaultPageNumber = 1;

            const expectedUsers = initialDbUsers.slice(0, defaultPageSize);
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                defaultPageNumber,
                defaultPageSize,
                Math.ceil(initialDbUsers.length / defaultPageSize),
                initialDbUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200);
            expect(response.body).toEqual(expected);
        });

        // non-default pageNumber
        it('should return correct part of users array if page number is non-default',
            async () => {
            const pageNumber = 2;
            const pageSize = DEFAULT_QUERY_VALUES.USERS.pageSize;

            const expectedUsers = initialDbUsers.slice(pageSize, 2 * pageSize);
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                pageNumber,
                pageSize,
                Math.ceil(initialDbUsers.length / pageSize),
                initialDbUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'pageNumber=' + pageNumber);
            expect(response.body).toEqual(expected);
        });

        // non-default pageSize
        it('should return correct part of users array if page size is non-default',
            async () => {
            const pageSize = 15;

            const expectedUsers = initialDbUsers.slice(0, pageSize);
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                pageSize,
                Math.ceil(initialDbUsers.length / pageSize),
                initialDbUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'pageSize=' + pageSize);
            expect(response.body).toEqual(expected);
        });

        // non-default pageNumber and pageSize
        it('should return correct part of users array if page number and page size are non-default',
            async () => {
            const pageNumber = 3;
            const pageSize = 15;

            const expectedUsers = initialDbUsers.slice(
                (pageNumber - 1) * pageSize, pageNumber * pageSize
            );
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                pageNumber,
                pageSize,
                Math.ceil(initialDbUsers.length / pageSize),
                initialDbUsers.length,
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'pageNumber=' + pageNumber
                + '&pageSize=' + pageSize);
            expect(response.body).toEqual(expected);
        });

        // pageNumber > total number of pages
        it('should return empty array if page number exceeds total number of pages',
            async () => {
            const pageSize = DEFAULT_QUERY_VALUES.USERS.pageSize;
            const totalCount = initialDbUsers.length;
            const pagesCount = Math.ceil(totalCount / pageSize);
            const pageNumber = pageSize + 5;

            const expectedUsers: UserDBType[] = [];
            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                pageNumber,
                pageSize,
                pagesCount,
                totalCount
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'pageNumber=' + pageNumber);
            expect(response.body).toEqual(expected);
        });

        // pageSize > total number of items
        it('should return all users if page size is greater than total number of users',
            async () => {
            const expectedUsers = initialDbUsers;
            const totalCount = expectedUsers.length;
            const pageSize = totalCount + 5;

            const expected = await usersQueryRepository.createUsersPaginator(
                expectedUsers,
                DEFAULT_QUERY_VALUES.USERS.pageNumber,
                pageSize,
                Math.ceil(totalCount / pageSize),
                totalCount
            );

            const response = await userTestManager.getUsers(HTTP_STATUSES.OK_200,
                'pageSize=' + pageSize);
            expect(response.body).toEqual(expected);
        });
    });

    describe('create user', () => {
        let initialDbUsers: UserDBType[];

        beforeAll(async () => {
            initialDbUsers = [
                {
                    id: '1',
                    login: 'user1',
                    email: 'user1@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash1',
                    isDeleted: false,
                }
            ];

            await setDb({ users: initialDbUsers });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        // authorization
        it('should forbid creating users for non-admin users', async () => {
            const data: CreateUserInputModel = {
                login: validUserFieldInput.login,
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            // no auth
            await req
                .post(SETTINGS.PATH.USERS)
                .send(data)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await userTestManager.createUser(data, HTTP_STATUSES.UNAUTHORIZED_401,
                    invalidAuthValue);
            }

            await userTestManager.checkUsersQuantity(initialDbUsers.length);
        });

        // validation
        // missing required fields
        it(`shouldn't create user if required fields are missing`, async () => {
            const data1 = {
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response1 = await userTestManager.createUser(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login is required',
                    }
                ],
            });

            const data2 = {
                login: validUserFieldInput.login,
                password: validUserFieldInput.password,
            };

            const response2 = await userTestManager.createUser(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'email',
                        message: 'Email is required',
                    }
                ],
            });

            const data3 = {
                login: validUserFieldInput.login,
                email: validUserFieldInput.email,
            };

            const response3 = await userTestManager.createUser(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password is required',
                    }
                ],
            });

            await userTestManager.checkUsersQuantity(initialDbUsers.length);
        });

        // login
        it(`shouldn't create user if login is invalid`, async () => {
            // not string
            const data1 = {
                login: 4,
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response1 = await userTestManager.createUser(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                login: '',
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response2 = await userTestManager.createUser(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                login: '  ',
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response3 = await userTestManager.createUser(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login must not be empty',
                    }
                ],
            });

            // too short
            const data4 = {
                login: 'aa',
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response4 = await userTestManager.createUser(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login length must be between 3 and 10 symbols',
                    }
                ],
            });

            // too long
            const data5 = {
                login: 'a'.repeat(11),
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response5 = await userTestManager.createUser(data5,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response5.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login length must be between 3 and 10 symbols',
                    }
                ],
            });

            // wrong format
            const loginPattern = '^[a-zA-Z0-9_-]*$';
            const data6 = {
                login: 'user !',
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response6 = await userTestManager.createUser(data6,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response6.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login must match the following pattern: ' + loginPattern,
                    }
                ],
            });

            // not unique
            const data7 = {
                login: initialDbUsers[0].login,
                email: validUserFieldInput.email,
                password: validUserFieldInput.password,
            };

            const response7 = await userTestManager.createUser(data7,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response7.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login must be unique',
                    }
                ],
            });

            await userTestManager.checkUsersQuantity(initialDbUsers.length);
        });

        // email
        it(`shouldn't create user if email is invalid`, async () => {
            // not string
            const data1 = {
                login: validUserFieldInput.login,
                email: 4,
                password: validUserFieldInput.password,
            };

            const response1 = await userTestManager.createUser(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'email',
                        message: 'Email must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                login: validUserFieldInput.login,
                email: '',
                password: validUserFieldInput.password,
            };

            const response2 = await userTestManager.createUser(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'email',
                        message: 'Email must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                login: validUserFieldInput.login,
                email: '  ',
                password: validUserFieldInput.password,
            };

            const response3 = await userTestManager.createUser(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'email',
                        message: 'Email must not be empty',
                    }
                ],
            });

            // wrong format
            const emailPattern = '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$';
            const data4 = {
                login: validUserFieldInput.login,
                email: 'example',
                password: validUserFieldInput.password,
            };

            const response4 = await userTestManager.createUser(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'email',
                        message: 'Email must match the following pattern: ' + emailPattern,
                    }
                ],
            });

            // not unique
            const data5 = {
                login: validUserFieldInput.login,
                email: initialDbUsers[0].email,
                password: validUserFieldInput.password,
            };

            const response5 = await userTestManager.createUser(data5,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response5.body).toEqual({
                errorsMessages: [
                    {
                        field: 'email',
                        message: 'Email must be unique',
                    }
                ],
            });

            await userTestManager.checkUsersQuantity(initialDbUsers.length);
        });

        // password
        it(`shouldn't create user if password is invalid`, async () => {
            // not string
            const data1 = {
                login: validUserFieldInput.login,
                email: validUserFieldInput.email,
                password: 4,
            };

            const response1 = await userTestManager.createUser(data1,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response1.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password must be a string',
                    }
                ],
            });

            // empty string
            const data2 = {
                login: validUserFieldInput.login,
                email: validUserFieldInput.email,
                password: '',
            };

            const response2 = await userTestManager.createUser(data2,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response2.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password must not be empty',
                    }
                ],
            });

            // empty string with spaces
            const data3 = {
                login: validUserFieldInput.login,
                email: validUserFieldInput.email,
                password: '  ',
            };

            const response3 = await userTestManager.createUser(data3,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response3.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password must not be empty',
                    }
                ],
            });

            // too short
            const data4 = {
                login: validUserFieldInput.login,
                email: validUserFieldInput.email,
                password: 'a'.repeat(5),
            };

            const response4 = await userTestManager.createUser(data4,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response4.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password length must be between 6 and 20 symbols',
                    }
                ],
            });

            // too long
            const data5 = {
                login: validUserFieldInput.login,
                email: validUserFieldInput.email,
                password: 'a'.repeat(21),
            };

            const response5 = await userTestManager.createUser(data5,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response5.body).toEqual({
                errorsMessages: [
                    {
                        field: 'password',
                        message: 'Password length must be between 6 and 20 symbols',
                    }
                ],
            });

            await userTestManager.checkUsersQuantity(initialDbUsers.length);
        });

        // multiple fields
        it(`shouldn't create user if multiple fields are invalid`, async () => {
            const data = {
                login: 'a'.repeat(11),
                password: '  ',
            };

            const response = await userTestManager.createUser(data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response.body).toEqual({
                errorsMessages: expect.arrayContaining([
                    { message: expect.any(String), field: 'login' },
                    { message: expect.any(String), field: 'email' },
                    { message: expect.any(String), field: 'password' },
                ]),
            });

            await userTestManager.checkUsersQuantity(initialDbUsers.length);
        });

        // both login and email are not unique
        it('should return one error if both login and email are not unique', async () => {
            const data = {
                login: initialDbUsers[0].login,
                email: initialDbUsers[0].email,
                password: validUserFieldInput.password,
            };

            const response = await userTestManager.createUser(data,
                HTTP_STATUSES.BAD_REQUEST_400);
            expect(response.body).toEqual({
                errorsMessages: [
                    {
                        field: 'login',
                        message: 'Login must be unique',
                    }
                ],
            });
        });

        // correct input
        it('should create user if input data is correct', async () => {
            const data: CreateUserInputModel = {
                login: 'user2',
                email: 'user2@example.com',
                password: 'qwerty',
            };

            await userTestManager.createUser(data, HTTP_STATUSES.CREATED_201);

            await userTestManager.checkUsersQuantity(initialDbUsers.length + 1);
        });

        it('should create one more user', async () => {
            const data: CreateUserInputModel = {
                login: 'user3',
                email: 'user3@example.com',
                password: '1234qwerty',
            };

            await userTestManager.createUser(data, HTTP_STATUSES.CREATED_201);

            await userTestManager.checkUsersQuantity(initialDbUsers.length + 2);
        });
    });

    describe('delete user', () => {
        let initialDbUsers: UserDBType[];

        beforeAll(async () => {
            initialDbUsers = initialDbUsers = [
                {
                    id: '1',
                    login: 'user1',
                    email: 'user1@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash1',
                    isDeleted: false,
                },
                {
                    id: '2',
                    login: 'user2',
                    email: 'user2@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash2',
                    isDeleted: true,
                },
                {
                    id: '3',
                    login: 'user3',
                    email: 'user3@example.com',
                    createdAt: '2024-12-16T05:32:26.882Z',
                    passwordHash: 'hash3',
                    isDeleted: false,
                },
            ];

            await setDb({ users: initialDbUsers });
        });

        afterAll(async () => {
            await req
                .delete(SETTINGS.PATH.TESTING + '/all-data');
        });

        it('should forbid deleting users for non-admin users', async () => {
            const userToDelete = initialDbUsers[0];

            // no auth
            await req
                .delete(SETTINGS.PATH.USERS + '/' + userToDelete.id)
                .expect(HTTP_STATUSES.UNAUTHORIZED_401);

            for (const invalidAuthValue of invalidAuthValues) {
                await userTestManager.deleteUser(userToDelete.id,
                    HTTP_STATUSES.UNAUTHORIZED_401, invalidAuthValue);
            }

            const dbDeletedUser = await usersTestRepository.findUserById(userToDelete.id);
            expect(dbDeletedUser).not.toBeNull();
        });

        it('should return 404 when deleting non-existing user', async () => {
            await userTestManager.deleteUser('-100',
                HTTP_STATUSES.NOT_FOUND_404);

            // deleted
            const userToDelete = initialDbUsers[1];
            await userTestManager.deleteUser(userToDelete.id,
                HTTP_STATUSES.NOT_FOUND_404);
        });

        it('should delete the first user', async () => {
            const userToDelete = initialDbUsers[0];

            await userTestManager.deleteUser(userToDelete.id,
                HTTP_STATUSES.NO_CONTENT_204);
        });
    });
});