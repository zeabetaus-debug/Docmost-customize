import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { Logger } from '@nestjs/common';

@Injectable()
export class ClientModeService {
  constructor(@InjectKysely() private readonly db: any) {}
  private readonly logger = new Logger(ClientModeService.name);

 async get(userId: string) {
  const result = await this.db
    .selectFrom('users')
    .select(['client_mode'])
    .where('id', '=', userId)
    .executeTakeFirst();

  return {
    client_mode: result?.client_mode ?? false,
  };
}

  async update(userId: string, value: boolean) {
    this.logger.log(`Updating client_mode=${value} for user=${userId}`);
    return await this.db
      .updateTable('users')
      .set({ client_mode: value })
      .where('id', '=', userId)
      .execute();
  }
}