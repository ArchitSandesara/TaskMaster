import { Body, Controller, Post, Req } from '@nestjs/common';
import { LoginDto, RegisterDto } from 'data';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // For demo, accept any email/password and issue token. Replace with real user lookup.
  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: any) { 
    return this.auth.login(body, {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')
    }); 
  }

  @Post('register')
  async register(@Body() body: RegisterDto, @Req() req: any) { 
    return this.auth.register(body, {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent')
    }); 
  }
}
