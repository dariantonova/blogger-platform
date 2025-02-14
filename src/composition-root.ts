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


// const objects: any[] = [];
//
// export const attemptsRepository = new AttemptsRepository();
// objects.push(attemptsRepository);
//
// export const deviceAuthSessionsRepository = new DeviceAuthSessionsRepository();
// objects.push(deviceAuthSessionsRepository);
//
// export const deviceAuthSessionsQueryRepository = new DeviceAuthSessionsQueryRepository();
// objects.push(deviceAuthSessionsQueryRepository);
//
// export const blogsRepository = new BlogsRepository();
// objects.push(blogsRepository);
//
// export const blogsQueryRepository = new BlogsQueryRepository();
// objects.push(blogsQueryRepository);
//
// export const postsRepository = new PostsRepository();
// objects.push(postsRepository);
//
// export const postsQueryRepository = new PostsQueryRepository();
// objects.push(postsQueryRepository);
//
// export const usersRepository = new UsersRepository();
// objects.push(usersRepository);
//
// export const usersQueryRepository = new UsersQueryRepository();
// objects.push(usersQueryRepository);
//
// export const commentsRepository = new CommentsRepository();
// objects.push(commentsRepository);
//
// export const commentsQueryRepository = new CommentsQueryRepository();
// objects.push(commentsQueryRepository);
//
// export const cryptoService = new CryptoService();
// objects.push(cryptoService);
//
// export const jwtService = new JwtService();
// objects.push(jwtService);
//
// export const nodemailerService = new NodemailerService();
// objects.push(nodemailerService);
//
// export const emailManager = new EmailManager(nodemailerService);
// objects.push(emailManager);
//
// export const attemptsService = new AttemptsService(attemptsRepository);
// objects.push(attemptsService);
//
// export const usersService = new UsersService(usersRepository, deviceAuthSessionsRepository, cryptoService);
// objects.push(usersService);
//
// export const authService = new AuthService(
//     deviceAuthSessionsRepository, usersService, usersRepository, cryptoService, jwtService, emailManager);
// objects.push(authService);
//
// export const securityDevicesService = new SecurityDevicesService(
//     deviceAuthSessionsRepository, jwtService);
// objects.push(securityDevicesService);
//
// export const blogsService = new BlogsService(blogsRepository, postsRepository);
// objects.push(blogsService);
//
// export const postsService = new PostsService(postsRepository, blogsRepository, commentsRepository);
// objects.push(postsService);
//
// export const commentsService = new CommentsService(commentsRepository, postsService, usersService);
// objects.push(commentsService);
//
// export const authController = new AuthController(authService, jwtService);
// objects.push(authController);
//
// export const blogsController = new BlogsController(
//     blogsService, blogsQueryRepository, postsService, postsQueryRepository);
// objects.push(blogsController);
//
// export const commentsController = new CommentsController(commentsService, commentsQueryRepository);
// objects.push(commentsController);
//
// export const postsController = new PostsController(
//     postsService, postsQueryRepository, commentsService, commentsQueryRepository);
// objects.push(postsController);
//
// export const securityDevicesController = new SecurityDevicesController(
//     securityDevicesService, deviceAuthSessionsQueryRepository);
// objects.push(securityDevicesController);
//
// export const usersController = new UsersController(usersService, usersQueryRepository);
// objects.push(usersController);
//
// export const container = {
//     objects,
//     get<T>(ClassType: any) {
//         return this.objects.find(o => o instanceof ClassType);
//     },
// };