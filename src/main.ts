import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

//   const server = new ApolloServer({
//     schema: buildSubgraphSchema({
//       typeDefs,
//       resolvers,
//     }),
//     context: ({ req }) => {
//       const user = req.headers['user-address'];
//       return { user };
//     },
//     csrfPrevention: true,
//     plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
//   });

//   await server.start();
//   app.use(cors());
//   app.use(express.json());
//   app.use('/api', api);
//   server.applyMiddleware({ app });

//   await new Promise<void>((resolve) =>
//     httpServer.listen({ port: port }, resolve),
//   );

//   return `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`;
// }
