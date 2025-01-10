import {MongoMemoryServer} from "mongodb-memory-server";
import {client, runDb, setDb} from "../../src/db/db";
import {req} from "../test-helpers";
import {SETTINGS} from "../../src/settings";
import {HTTP_STATUSES} from "../../src/utils";
import {invalidAuthValues} from "../datasets/authorization-data";
import {userTestManager} from "../test-managers/user-test-manager";
import {usersQueryRepository} from "../../src/features/users/repositories/users.query.repository";
import {DEFAULT_QUERY_VALUES} from "../../src/helpers/query-params-values";
import {UserDBType} from "../../src/types";

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
        it('', async () => {

        });

        // invalid pageSize
        it('', async () => {

        });

        // invalid pageNumber and pageSize
        it('', async () => {

        });

        // pageNumber and pageSize defaults
        it('', async () => {

        });

        // non-default pageNumber
        it('', async () => {

        });

        // non-default pageSize
        it('', async () => {

        });

        // pageNumber > total number of pages
        it('', async () => {

        });

        // pageSize > total number of items
        it('', async () => {

        });
    });

});