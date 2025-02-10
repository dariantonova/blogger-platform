import {AttemptsRepository} from "./application/attempts.repository";
import {DeviceAuthSessionsRepository} from "./features/auth/device-auth-sessions.repository";
import {DeviceAuthSessionsQueryRepository} from "./features/auth/device-auth-sessions.query.repository";
import {BlogsRepository} from "./features/blogs/repositories/blogs.repository";
import {BlogsQueryRepository} from "./features/blogs/repositories/blogs.query.repository";
import {PostsRepository} from "./features/posts/repositories/posts.repository";
import {UsersRepository} from "./features/users/repositories/users.repository";
import {UsersQueryRepository} from "./features/users/repositories/users.query.repository";
import {CommentsRepository} from "./features/comments/comments.repository";
import {CommentsQueryRepository} from "./features/comments/comments.query.repository";
import {CryptoService} from "./application/crypto.service";
import {JwtService} from "./application/jwt.service";
import {NodemailerService} from "./application/nodemailer.service";
import {EmailManager} from "./application/email.manager";
import {AttemptsService} from "./application/attempts.service";
import {UsersService} from "./features/users/users.service";
import {AuthService} from "./features/auth/auth.service";
import {SecurityDevicesService} from "./features/security-devices/security-devices.service";
import {BlogsService} from "./features/blogs/blogs.service";
import {PostsService} from "./features/posts/posts.service";
import {CommentsService} from "./features/comments/comments.service";
import {AuthController} from "./features/auth/auth.controller";
import {BlogsController} from "./features/blogs/blogs.controller";
import {PostsQueryRepository} from "./features/posts/repositories/posts.query.repository";
import {CommentsController} from "./features/comments/comments.controller";
import {PostsController} from "./features/posts/posts.controller";
import {SecurityDevicesController} from "./features/security-devices/security-devices.controller";
import {UsersController} from "./features/users/users.controller";

export const attemptsRepository = new AttemptsRepository();
export const deviceAuthSessionsRepository = new DeviceAuthSessionsRepository();
export const deviceAuthSessionsQueryRepository = new DeviceAuthSessionsQueryRepository();
export const blogsRepository = new BlogsRepository();
export const blogsQueryRepository = new BlogsQueryRepository();
export const postsRepository = new PostsRepository();
export const postsQueryRepository = new PostsQueryRepository();
export const usersRepository = new UsersRepository();
export const usersQueryRepository = new UsersQueryRepository();
export const commentsRepository = new CommentsRepository();
export const commentsQueryRepository = new CommentsQueryRepository();

export const cryptoService = new CryptoService();
export const jwtService = new JwtService();
export const nodemailerService = new NodemailerService();

export const emailManager = new EmailManager(nodemailerService);
export const attemptsService = new AttemptsService(attemptsRepository);
export const usersService = new UsersService(usersRepository, deviceAuthSessionsRepository, cryptoService);
export const authService = new AuthService(
    deviceAuthSessionsRepository, usersService, usersRepository, cryptoService, jwtService, emailManager);
export const securityDevicesService = new SecurityDevicesService(
    deviceAuthSessionsRepository, jwtService);
export const blogsService = new BlogsService(blogsRepository, postsRepository);
export const postsService = new PostsService(postsRepository, blogsRepository, commentsRepository);
export const commentsService = new CommentsService(commentsRepository, postsService, usersService);

export const authController = new AuthController(authService, jwtService);
export const blogsController = new BlogsController(
    blogsService, blogsQueryRepository, postsService, postsQueryRepository);
export const commentsController = new CommentsController(commentsService, commentsQueryRepository);
export const postsController = new PostsController(
    postsService, postsQueryRepository, commentsService, commentsQueryRepository);
export const securityDevicesController = new SecurityDevicesController(
    securityDevicesService, deviceAuthSessionsQueryRepository);
export const usersController = new UsersController(usersService, usersQueryRepository);