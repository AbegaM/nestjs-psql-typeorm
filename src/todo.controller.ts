import { Body, Controller, Delete, Get, Param, Post, Put, } from '@nestjs/common';
import CreateTodoDto from './dto/todo.create.dto';
import { TodoService } from './todo.service';
import { UpdateTodoDto } from './dto/todo.update.dto';

@Controller('todos')
export class TodoController {
  constructor(private readonly todosService: TodoService) {}

  // get all todos
  @Get()
  getTodos() {
    return this.todosService.getAllTodos();
  }

  // get todo by id
  @Get(':id')
  getTodoById(@Param('id') id: number) {
    return this.todosService.getTodoByid(Number(id));
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