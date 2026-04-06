import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '@docmost/db/types/kysely.types';
import { DB, Users } from '@docmost/db/types/db';
import { hashPassword } from '../../../common/helpers';
import { dbOrTx } from '@docmost/db/utils';
import {
  InsertableUser,
  UpdatableUser,
  User,
} from '@docmost/db/types/entity.types';
import { PaginationOptions } from '../../pagination/pagination-options';
import { executeWithCursorPagination } from '@docmost/db/pagination/cursor-pagination';
import { ExpressionBuilder, sql } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

@Injectable()
export class UserRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  public baseFields: Array<keyof Users> = [
    'id',
    'email',
    'name',
    'emailVerifiedAt',
    'avatarUrl',
    'role',
    'workspaceId',
    'locale',
    'timezone',
    'settings',
    'lastLoginAt',
    'deactivatedAt',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'hasGeneratedPassword',
  ];

  async findById(
    userId: string,
    workspaceId: string,
    opts?: {
      includePassword?: boolean;
      includeUserMfa?: boolean;
      trx?: KyselyTransaction;
    },
  ): Promise<User> {
    const db = dbOrTx(this.db, opts?.trx);
    const row: any = await db
      .selectFrom('users')
      .select(this.baseFields)
      .$if(opts?.includePassword, (qb) => qb.select('password'))
      .$if(opts?.includeUserMfa, (qb) => qb.select(this.withUserMfa))
      .select(sql`users.client_mode`.as('client_mode'))
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    if (!row) return null as any;

    // map DB client_mode to camelCase clientMode for API consumers
    return {
      ...(row as any),
      clientMode: row.client_mode ?? false,
    } as any;
  }

  async findByEmail(
    email: string,
    workspaceId: string,
    opts?: {
      includePassword?: boolean;
      includeUserMfa?: boolean;
      trx?: KyselyTransaction;
    },
  ): Promise<User> {
    const db = dbOrTx(this.db, opts?.trx);
    const row: any = await db
      .selectFrom('users')
      .select(this.baseFields)
      .$if(opts?.includePassword, (qb) => qb.select('password'))
      .$if(opts?.includeUserMfa, (qb) => qb.select(this.withUserMfa))
      .select(sql`users.client_mode`.as('client_mode'))
      .where(sql`LOWER(email)`, '=', sql`LOWER(${email})`)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    if (!row) return null as any;

    return {
      ...(row as any),
      clientMode: row.client_mode ?? false,
    } as any;
  }

  async updateUser(
    updatableUser: UpdatableUser,
    userId: string,
    workspaceId: string,
    trx?: KyselyTransaction,
  ) {
    const db = dbOrTx(this.db, trx);

    // Fetch existing user settings and client_mode
    const existing: any = await db
      .selectFrom('users')
      .select(this.baseFields)
      .select(sql`users.client_mode`.as('client_mode'))
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    const existingSettings = (existing?.settings as any) || {};
    const incomingSettings = ((updatableUser as any)?.settings as any) || {};
    const updatedSettings = {
      ...existingSettings,
      ...incomingSettings,
    };

    const updatedClientMode =
      typeof (updatableUser as any)?.clientMode !== 'undefined'
        ? (updatableUser as any).clientMode
        : existing?.client_mode ?? false;

    // Avoid spreading clientMode into the generic update object
    const { clientMode, ...rest } = (updatableUser as any) || {};

    await db
      .updateTable('users')
      .set({
        ...rest,
        settings: updatedSettings,
        client_mode: updatedClientMode,
        updatedAt: new Date(),
      } as any)
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .execute();

    // Return updated user with clientMode field
    const row: any = await db
      .selectFrom('users')
      .select(this.baseFields)
      .select(sql`users.client_mode`.as('client_mode'))
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    return {
      ...(row as any),
      clientMode: row?.client_mode ?? false,
    } as any;
  }

  async updateLastLogin(userId: string, workspaceId: string) {
    return await this.db
      .updateTable('users')
      .set({
        lastLoginAt: new Date(),
      })
      .where('id', '=', userId)
      .where('workspaceId', '=', workspaceId)
      .execute();
  }

  async insertUser(
    insertableUser: InsertableUser,
    trx?: KyselyTransaction,
  ): Promise<User> {
    const user: InsertableUser = {
      name:
        insertableUser.name || insertableUser.email.split('@')[0].toLowerCase(),
      email: insertableUser.email.toLowerCase(),
      password: await hashPassword(insertableUser.password),
      locale: 'en-US',
      role: insertableUser?.role,
      lastLoginAt: new Date(),
    };

    const db = dbOrTx(this.db, trx);
    return db
      .insertInto('users')
      .values({ ...insertableUser, ...user })
      .returning(this.baseFields)
      .executeTakeFirst();
  }

  async roleCountByWorkspaceId(
    role: string,
    workspaceId: string,
  ): Promise<number> {
    const { count } = await this.db
      .selectFrom('users')
      .select((eb) => eb.fn.count('role').as('count'))
      .where('role', '=', role)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    return count as number;
  }

  async getUsersPaginated(workspaceId: string, pagination: PaginationOptions) {
    let query = this.db
      .selectFrom('users')
      .select(this.baseFields)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null);

    if (pagination.query) {
      query = query.where((eb) =>
        eb(
          sql`f_unaccent(users.name)`,
          'ilike',
          sql`f_unaccent(${'%' + pagination.query + '%'})`,
        ).or(
          sql`users.email`,
          'ilike',
          sql`f_unaccent(${'%' + pagination.query + '%'})`,
        ),
      );
    }

    return executeWithCursorPagination(query, {
      perPage: pagination.limit,
      cursor: pagination.cursor,
      beforeCursor: pagination.beforeCursor,
      fields: [
        { expression: 'name', direction: 'asc' },
        { expression: 'id', direction: 'asc' },
      ],
      parseCursor: (cursor) => ({ name: cursor.name, id: cursor.id }),
    });
  }

  async updatePreference(
    userId: string,
    prefKey: string,
    prefValue: string | boolean,
  ) {
    return await this.db
      .updateTable('users')
      .set({
        settings: sql`COALESCE(settings, '{}'::jsonb)
                || jsonb_build_object('preferences', COALESCE(settings->'preferences', '{}'::jsonb) 
                || jsonb_build_object('${sql.raw(prefKey)}', ${sql.lit(prefValue)}))`,
        updatedAt: new Date(),
      })
      .where('id', '=', userId)
      .returning(this.baseFields)
      .executeTakeFirst();
  }

  withUserMfa(eb: ExpressionBuilder<DB, 'users'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('userMfa')
        .select([
          'userMfa.id',
          'userMfa.method',
          'userMfa.isEnabled',
          'userMfa.createdAt',
        ])
        .whereRef('userMfa.userId', '=', 'users.id'),
    ).as('mfa');
  }
}