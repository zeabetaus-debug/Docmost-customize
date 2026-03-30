import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';

@Injectable()
export class ZeaAtlasService {
  constructor(
    @InjectKysely() private readonly db: KyselyDB,
  ) {}

  async getPages() {
    const result = await (this.db as any)
      .selectFrom('zeaatlas_pages')
      .selectAll()
      .execute();

    return result; // ✅ MUST RETURN RESULT
  }

  async createPage(body: { title: string }) {
    const result = await (this.db as any)
      .insertInto('zeaatlas_pages')
      .values({
        title: body.title,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    return result; // ✅ MUST RETURN RESULT
  }
}