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
import {Container} from "inversify";
import "reflect-metadata";

// export const attemptsRepository = new AttemptsRepository();
// export const deviceAuthSessionsRepository = new DeviceAuthSessionsRepository();
// export const deviceAuthSessionsQueryRepository = new DeviceAuthSessionsQueryRepository();
// export const blogsRepository = new BlogsRepository();
// export const blogsQueryRepository = new BlogsQueryRepository();
// export const postsRepository = new PostsRepository();
// export const postsQueryRepository = new PostsQueryRepository();
// export const usersRepository = new UsersRepository();
// export const usersQueryRepository = new UsersQueryRepository();
// export const commentsRepository = new CommentsRepository();
// export const commentsQueryRepository = new CommentsQueryRepository();
//
// export const cryptoService = new CryptoService();
// export const jwtService = new JwtService();
// export const nodemailerService = new NodemailerService();
//
// export const emailManager = new EmailManager(nodemailerService);
// export const attemptsService = new AttemptsService(attemptsRepository);
// export const usersService = new UsersService(usersRepository, deviceAuthSessionsRepository, cryptoService);
// export const authService = new AuthService(
//     deviceAuthSessionsRepository, usersService, usersRepository, cryptoService, jwtService, emailManager);
// export const securityDevicesService = new SecurityDevicesService(
//     deviceAuthSessionsRepository, jwtService);
// export const blogsService = new BlogsService(blogsRepository, postsRepository);
// export const postsService = new PostsService(postsRepository, blogsRepository, commentsRepository);
// export const commentsService = new CommentsService(commentsRepository, postsService, usersService);
//
// export const authController = new AuthController(authService, jwtService);
// export const blogsController = new BlogsController(
//     blogsService, blogsQueryRepository, postsService, postsQueryRepository);
// export const commentsController = new CommentsController(commentsService, commentsQueryRepository);
// export const postsController = new PostsController(
//     postsService, postsQueryRepository, commentsService, commentsQueryRepository);
// export const securityDevicesController = new SecurityDevicesController(
//     securityDevicesService, deviceAuthSessionsQueryRepository);
// export const usersController = new UsersController(usersService, usersQueryRepository);

const container = new Container();

container.bind(AttemptsRepository).to(AttemptsRepository);
container.bind(DeviceAuthSessionsRepository).to(DeviceAuthSessionsRepository);
container.bind(DeviceAuthSessionsQueryRepository).to(DeviceAuthSessionsQueryRepository);
container.bind(BlogsRepository).to(BlogsRepository);
container.bind(BlogsQueryRepository).to(BlogsQueryRepository);
container.bind(PostsRepository).to(PostsRepository);
container.bind(PostsQueryRepository).to(PostsQueryRepository);
container.bind(UsersRepository).to(UsersRepository);
container.bind(UsersQueryRepository).to(UsersQueryRepository);
container.bind(CommentsRepository).to(CommentsRepository);
container.bind(CommentsQueryRepository).to(CommentsQueryRepository);
container.bind(CryptoService).to(CryptoService);
container.bind(JwtService).to(JwtService);
container.bind(NodemailerService).to(NodemailerService);
container.bind(EmailManager).to(EmailManager);
container.bind(AttemptsService).to(AttemptsService);
container.bind(UsersService).to(UsersService);
container.bind(AuthService).to(AuthService);
container.bind(SecurityDevicesService).to(SecurityDevicesService);
container.bind(BlogsService).to(BlogsService);
container.bind(PostsService).to(PostsService);
container.bind(CommentsService).to(CommentsService);
container.bind(AuthController).to(AuthController);
container.bind(BlogsController).to(BlogsController);
container.bind(CommentsController).to(CommentsController);
container.bind(PostsController).to(PostsController);
container.bind(SecurityDevicesController).to(SecurityDevicesController);
container.bind(UsersController).to(UsersController);

export { container };