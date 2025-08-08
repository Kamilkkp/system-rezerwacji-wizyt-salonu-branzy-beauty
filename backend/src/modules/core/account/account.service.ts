import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { InjectTransaction, Transaction } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import * as bcrypt from 'bcrypt';
import { AccountDto } from './dto/account.dto';
import { UUID } from 'crypto';

@Injectable()
export class AccountService {
  constructor(
    @InjectTransaction()
    private readonly tx: Transaction<TransactionalAdapterPrisma>,
  ) {}

  async create({ password, ...rest }: CreateAccountDto) {
    await this.tx.user.create({
      data: {
        ...rest,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  }

  async findOne(id: UUID) {
    const userEntry = await this.tx.user.findUnique({ where: { id } });

    if (!userEntry) {
      throw new NotFoundException();
    }

    return new AccountDto(userEntry);
  }

  async update(id: UUID, { password, ...rest }: UpdateAccountDto) {
    const result = await this.tx.user.update({
      data: {
        ...rest,
        ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
      },
      where: { id },
    });

    return new AccountDto(result);
  }

  async remove(id: UUID) {
    await this.tx.user.delete({ where: { id } });
  }
}
