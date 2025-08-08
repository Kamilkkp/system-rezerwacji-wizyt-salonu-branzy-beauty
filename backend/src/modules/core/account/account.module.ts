import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { CommandModule } from 'nestjs-command';
import { CreateUserCommand } from './commands/create-user.command';

@Module({
  imports: [CommandModule],
  providers: [AccountService, CreateUserCommand],
  exports: [AccountService],
})
export class AccountModule {}
