import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { LoginResponseDto, RegisterResponseDto } from '@spellbound/shared';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const found = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!found) {
      throw new UnauthorizedException('User doesnt exist');
    }

    const passwordValid = await bcrypt.compare(dto.password, found.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: found.id,
    });

    return {
      accessToken,
      id: found.id,
      email: found.email,
      name: found.name,
    };
  }

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const foundUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (foundUser) {
      throw new BadRequestException('Email already exist');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      email: user.email,
    };
  }
}
