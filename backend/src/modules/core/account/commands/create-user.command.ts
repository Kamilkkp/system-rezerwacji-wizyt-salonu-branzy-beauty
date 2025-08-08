import { Command, Option } from 'nestjs-command';
import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from '../account.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { validate } from 'class-validator';

@Injectable()
export class CreateUserCommand {
  private readonly logger: Logger;

  constructor(private readonly accountsService: AccountService) {
    this.logger = new Logger(CreateUserCommand.name);
  }

  @Command({
    command: 'create:account',
    describe: 'Creates account',
    aliases: ['ca'],
  })
  async create(
    @Option({
      name: 'email',
      describe: 'user email',
      type: 'string',
      demandOption: true,
      default: 'user@example.com',
      alias: 'e',
    })
    email: string,

    @Option({
      name: 'password',
      describe: 'Password for user',
      type: 'string',
      demandOption: true,
      default: 'Passwd1!',
      alias: 'p',
    })
    password: string,

    @Option({
      name: 'firstName',
      describe: 'First name of user',
      type: 'string',
      default: 'John',
      alias: 'fn',
    })
    firstName: string,

    @Option({
      name: 'lastName',
      describe: 'Last name of user',
      type: 'string',
      default: 'Smith',
      alias: 'ln',
    })
    lastName: string,
  ) {
    const payload = new CreateAccountDto({
      email,
      lastName,
      firstName,
      password,
    });

    const errors = await validate(payload);

    if (errors.length > 0) {
      throw new Error(errors.toString());
    }

    await this.accountsService.create(payload);

    this.logger.log(`User ${payload.email} created successfully`);
  }
}
