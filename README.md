# NestJs PSQL TypeORM

## Steps

1. Generate a new project

   ```
   nest new <project-name>
   ```

2. Run project in development mode

   ```
   npm run start:dev
   ```

   - For this project we will use **TypeORM** to manage the database schema, TypeORM allows you to model your data entities in **typescript** and it will apply this models into a SQL table strurcture in PSQL.

3. In NestJS we have a package called `ConfigModule` that we can use to read the configuration data, It uses `dotenv` behind the scene. To use `ConfigModule` we need to install `@nestjs/config`

   ```
   npm i @nestjs/config
   ```

4. Add your environment variables in a `.env` file

   ```
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=myuser
   POSTGRES_PASSWORD=password
   POSTGRES_DB=todolist_db
   ```

5. For this project to implement API level validation we will use `Joi`

   ```
   npm i joi @types/joi
   ```

6. Add validation for your environment variables

   ```ts
   //app.module.ts
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { AppController } from './app.controller';
   import { AppService } from './app.service';
   import * as Joi from 'joi';

   @Module({
     imports: [
       ConfigModule.forRoot({
         envFilePath: '.env',
         validationSchema: Joi.object({
           POSTGRES_HOST: Joi.string().required(),
           POSTGRES_PORT: Joi.number().required(),
           POSTGRES_USER: Joi.string().required(),
           POSTGRES_PASSWORD: Joi.string().required(),
           POSTGRES_DB: Joi.string().required(),
           PORT: Joi.number(),
         }),
       }),
     ],
     controllers: [AppController],
     providers: [AppService],
   })
   export class AppModule {}
   ```

7. Connect the app with PSQL by using TypeORM

   - The first step to connect the nest app with the Psql database is by using TypeORM

     ```
     npm i @nestjs/typeorm typeorm pg
     ```

8. Create a `database.module.ts` file

   ```ts
   import { Module } from '@nestjs/common';
   import { ConfigModule, ConfigService } from '@nestjs/config';
   import { TypeOrmModule } from '@nestjs/typeorm';
   import { join } from 'path';

   @Module({
     imports: [
       TypeOrmModule.forRootAsync({
         imports: [ConfigModule],
         inject: [ConfigService],
         useFactory: (configService: ConfigService) => ({
           type: 'postgres',
           host: configService.get('POSTGRES_HOST'),
           port: configService.get('POSTGRES_PORT'),
           username: configService.get('POSTGRES_USER'),
           password: configService.get('POSTGRES_PASSWORD'),
           database: configService.get('POSTGRES_DB'),
           entities: [join(__dirname, '**', '*.entity.{ts,js}')],
           ssl: {
             rejectUnauthorized: false,
           },
           synchronize: true, //should be false at production!
         }),
       }),
     ],
   })
   export class DatabaseModule {}
   ```

9. Import the `database.module.ts` to the `app.module.ts`

   ```ts
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { AppController } from './app.controller';
   import { AppService } from './app.service';
   import * as Joi from 'joi';
   import { DatabaseModule } from './database.module';

   @Module({
     imports: [
       ConfigModule.forRoot({
         envFilePath: '.env',
         validationSchema: Joi.object({
           POSTGRES_HOST: Joi.string().required(),
           POSTGRES_PORT: Joi.number().required(),
           POSTGRES_USER: Joi.string().required(),
           POSTGRES_PASSWORD: Joi.string().required(),
           POSTGRES_DB: Joi.string().required(),
           PORT: Joi.number(),
         }),
       }),
       DatabaseModule,
     ],
     controllers: [AppController],
     providers: [AppService],
   })
   export class AppModule {}
   ```

10. Build an entity, entity is a class that maps your data model to database tables, to create entity you can use the `@Entity()` decorator.

    ```ts
    import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

    @Entity()
    class Todo {
      @PrimaryGeneratedColumn()
      public id: number;

      @Column()
      public title: string;

      @Column()
      public content: string;

      @Column()
      public f_done: boolean;
    }

    export default Todo;
    ```

    - `PrimaryGeneratedColumn()` is a decorator from TypeORM which will create an integer primary key for `id` column and generate the value automatically as a sequence.
    - `@Column()` decorator marks property as a column.

11. Creare a DTO

    ```ts
    export class CreateTodoDto {
      title: string;
      content: string;
      f_done: boolean;
    }

    export default CreateTodoDto;
    ```

12. Create a repository

    - With repository we can manage particular entity, repository has some functions to interact with entity and are handled by TypeORM so we just need to use the class as constructor at our `TodoService` module

      ```ts
      //todo.service.ts
      import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
      import { InjectRepository } from '@nestjs/typeorm';
      import { Repository } from 'typeorm';
      import CreateTodoDto from './dto/createTodo.dto';
      import Todo from './entity/todos.entity';
      import { UpdateTodoDto } from './dto/updateTodo.dto';

      @Injectable()
      export class TodosService {
        constructor(
          @InjectRepository(Todo) private todoRepository: Repository<Todo>,
        ) {}

        // find all
        getAllTodos() {
          return this.todoRepository.find();
        }

        // find by id
        async getTodoById(id: number) {
          const todo = await this.todoRepository.findOne(id);
          if (todo) {
            return todo;
          }

          throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);
        }

        // create
        async createTodo(todo: CreateTodoDto) {
          const newTodo = await this.todoRepository.create(todo);
          await this.todoRepository.save(newTodo);

          return newTodo;
        }

        // update
        async updateTodo(id: number, post: UpdateTodoDto) {
          await this.todoRepository.update(id, post);
          const updatedTodo = await this.todoRepository.findOne(id);
          if (updatedTodo) {
            return updatedTodo;
          }

          throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);
        }

        // delete
        async deleteTodo(id: number) {
          const deletedTodo = await this.todoRepository.delete(id);
          if (!deletedTodo.affected) {
            throw new HttpException('Todo not found', HttpStatus.NOT_FOUND);
          }
        }
      }
      ```

13. Build the controller, a controller will handle incoming requests and returns a response to the client, it will get the data from the service and returns it to the client

    ```ts
    //todo.controller.ts
    import {
      Body,
      Controller,
      Delete,
      Get,
      Param,
      Post,
      Put,
    } from '@nestjs/common';
    import CreateTodoDto from './dto/createTodo.dto';
    import { TodosService } from './todos.service';
    import { UpdateTodoDto } from './dto/updateTodo.dto';

    @Controller('todos')
    export class TodosController {
      constructor(private readonly todosService: TodosService) {}

      // get all todos
      @Get()
      getTodos() {
        return this.todosService.getAllTodos();
      }

      // get todo by id
      @Get(':id')
      getTodoById(@Param('id') id: string) {
        return this.todosService.getTodoById(Number(id));
      }

      // create todo
      @Post()
      async createTodo(@Body() todo: CreateTodoDto) {
        return this.todosService.createTodo(todo);
      }

      // update todo
      @Put(':id')
      async updatePost(@Param('id') id: string, @Body() todo: UpdateTodoDto) {
        return this.todosService.updateTodo(Number(id), todo);
      }

      //delete todo
      @Delete(':id')
      async deleteTodo(@Param('id') id: string) {
        this.todosService.deleteTodo(Number(id));
      }
    }
    ```

### Questions

1. In `database.module.ts` file we are importing the entities using a regex format, why is not the commented part working ?

   ```ts
   @Module({
       imports: [
           TypeOrmModule.forRootAsync({
               imports: [ConfigModule],
               inject: [ConfigService],

               useFactory: (configService: ConfigService) => ({
                   type: 'postgres',
                   host: configService.get('POSTGRES_HOST'),
                   port: configService.get('POSTGRES_PORT'),
                   username: configService.get('POSTGRES_USER'),
                   password: configService.get('POSTGRES_PASSWORD'),
                   database: configService.get('POSTGRES_DB'),
                   //entities: [join(__dirname, '**', '*.entity.{ts,js')],
                   entities: [Todo],
                   synchronize: true, //should be false in production
               })
         })
     ]
   })
   ```

​
