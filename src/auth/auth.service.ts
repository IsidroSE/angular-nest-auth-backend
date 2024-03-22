import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';
import { CreateUserDto, UpdateAuthDto, LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService
  ) { }

  async create(createUserDto: CreateUserDto | RegisterDto): Promise<User> {

    try {
      // Desestructuramos el dto para separar la pass del resto del objeto
      const { password, ...userData } = createUserDto;

      // Se convierte el dto a user, encriptando la pass
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

      // Guardar user
      await newUser.save();

      // Volvemos a separar la pass para no devolver el hash
      const { password: _, ...user } = newUser.toJSON();
      return user;
    } catch (error) {
      if (error.code == 11000) {
        throw new BadRequestException(`${createUserDto.email} alredy exists!`);
      }
      throw new InternalServerErrorException('Something terrible happen!!!');
    }
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    const user: User = await this.create(registerDto);
    if (!user) {
      throw new InternalServerErrorException('Something VERY terrible happen!!!');
    }
    return {
      user: user,
      token: this.getJwtToken({ id: user._id })
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {

    // Desestructuramos el dto para separar la pass y el email
    const { email, password } = loginDto;

    // Buscamos el usuario con el email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Not valid credentials - email');
    }

    // Se comprueba si se obtiene el mismo hash con la pass recibida y el guardado en bbdd
    if (!bcryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Not valid credentials - password');
    }

    // Quitamos la pass del user
    const { password: _, ...rest } = user.toJSON();

    // Devolvemos la info del user sin la pass y generamos un jwt que devolveremos tambien
    return {
      user: rest,
      token: this.getJwtToken({ id: user.id })
    }

  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findUserById(id: string) {
    const user = await this.userModel.findById(id);
    const { password, ...rest } = user.toJSON();
    return rest;
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} auth`;
  // }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} auth`;
  // }

  public getJwtToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }
}
