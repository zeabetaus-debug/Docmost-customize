import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import { PageService } from '../../core/page/services/page.service';
import { CreatePageDto } from '../../core/page/dto/create-page.dto';
import { UpdatePageDto } from '../../core/page/dto/update-page.dto';

type CreateZeaAtlasPageDto = {
  title?: string;
  content?: string;
  createdBy?: string;
  userId?: string;
  spaceId?: string;
};

type UpdateZeaAtlasPageDto = {
  title?: string;
  content?: string;
  createdBy?: string;
  userId?: string;
};

type ExcelCellPayload = {
  row?: number;
  column?: number;
  value?: string | number | null;
};

type ExcelSheetPayload = {
  cells?: ExcelCellPayload[];
};

type ExcelWorkbookPayload = {
  worksheets?: ExcelSheetPayload[];
};

type TiptapDocPayload = {
  type?: string;
  content?: unknown[];
};

const isUuid = (value?: string) =>
  Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value.trim(),
      ),
  );

@Injectable()
export class ZeaAtlasService {
  private readonly logger = new Logger(ZeaAtlasService.name);

  constructor(
    @InjectKysely() private readonly db: KyselyDB,
    private readonly pageService: PageService,
  ) {}

  async getPages() {
    return this.db
      .selectFrom('pages')
      .select([
        'id',
        'slugId',
        'title',
        'spaceId',
        'workspaceId',
        'createdAt',
        'updatedAt',
      ])
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .execute();
  }

  private async resolveContext(dto: CreateZeaAtlasPageDto) {
    const requestedSpaceId = isUuid(dto.spaceId) ? dto.spaceId?.trim() : null;
    const selectedSpace = requestedSpaceId
      ? await this.db
          .selectFrom('spaces')
          .select(['id', 'workspaceId'])
          .where('id', '=', requestedSpaceId)
          .executeTakeFirst()
      : await this.db
          .selectFrom('spaces')
          .select(['id', 'workspaceId'])
          .orderBy('createdAt', 'asc')
          .executeTakeFirst();

    if (!selectedSpace) {
      throw new NotFoundException('No space found to create a page');
    }

    const requestedActorId = isUuid(dto.userId)
      ? dto.userId?.trim()
      : isUuid(dto.createdBy)
        ? dto.createdBy?.trim()
        : null;
    const requestedUser = requestedActorId
      ? await this.db
          .selectFrom('users')
          .select(['id'])
          .where('id', '=', requestedActorId)
          .where('workspaceId', '=', selectedSpace.workspaceId)
          .where('deletedAt', 'is', null)
          .executeTakeFirst()
      : null;

    const fallbackUser = requestedUser
      ? null
      : await this.db
          .selectFrom('users')
          .select(['id'])
          .where('workspaceId', '=', selectedSpace.workspaceId)
          .where('deletedAt', 'is', null)
          .orderBy('createdAt', 'asc')
          .executeTakeFirst();

    const actorId = requestedUser?.id ?? fallbackUser?.id;
    if (!actorId) {
      throw new NotFoundException('No user found to create a page');
    }

    return {
      actorId,
      spaceId: selectedSpace.id,
      workspaceId: selectedSpace.workspaceId,
    };
  }

  private convertExcelToDocmostTable(
    sheetJson: string | object | null | undefined,
  ) {
    try {
      const parsed =
        typeof sheetJson === 'string'
          ? JSON.parse(sheetJson)
          : (sheetJson ?? {});

      // If payload is already a valid Tiptap doc, keep it unchanged.
      const docPayload = parsed as TiptapDocPayload;
      if (docPayload?.type === 'doc' && Array.isArray(docPayload?.content)) {
        return docPayload;
      }

      const workbookPayload = parsed as ExcelWorkbookPayload;

      const cells = workbookPayload?.worksheets?.[0]?.cells ?? [];
      if (!Array.isArray(cells) || cells.length === 0) {
        return {
          type: 'doc',
          content: [
            {
              type: 'table',
              content: [
                {
                  type: 'tableRow',
                  content: [
                    {
                      type: 'tableCell',
                      content: [
                        {
                          type: 'paragraph',
                          content: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        };
      }

      const normalizedCells = cells
        .map((cell) => ({
          row: Number(cell.row),
          column: Number(cell.column),
          value: cell.value == null ? '' : String(cell.value),
        }))
        .filter((cell) => Number.isFinite(cell.row) && Number.isFinite(cell.column));

      if (normalizedCells.length === 0) {
        return {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Empty sheet' }],
            },
          ],
        };
      }

      const minRow = Math.min(...normalizedCells.map((cell) => cell.row));
      const minCol = Math.min(...normalizedCells.map((cell) => cell.column));
      const oneBased = minRow >= 1 && minCol >= 1;

      const indexedCells = normalizedCells.map((cell) => ({
        row: oneBased ? cell.row - 1 : cell.row,
        column: oneBased ? cell.column - 1 : cell.column,
        value: cell.value,
      }));

      const maxRow = Math.max(...indexedCells.map((cell) => cell.row), 0);
      const maxCol = Math.max(...indexedCells.map((cell) => cell.column), 0);

      const grid = Array.from({ length: maxRow + 1 }, () =>
        Array.from({ length: maxCol + 1 }, () => ''),
      );

      indexedCells.forEach((cell) => {
        if (cell.row < 0 || cell.column < 0) {
          return;
        }
        if (!grid[cell.row] || grid[cell.row][cell.column] === undefined) {
          return;
        }
        grid[cell.row][cell.column] = cell.value ?? '';
      });

      return {
        type: 'doc',
        content: [
          {
            type: 'table',
            content: grid.map((row) => ({
              type: 'tableRow',
              content: row.map((value) => ({
                type: 'tableCell',
                content: [
                  {
                    type: 'paragraph',
                    content: value ? [{ type: 'text', text: String(value) }] : [],
                  },
                ],
              })),
            })),
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Unable to render table' }],
          },
        ],
      };
    }
  }

  async createPage(dto: CreateZeaAtlasPageDto) {
    const { actorId, spaceId, workspaceId } = await this.resolveContext(dto);
    this.logger.log(`Incoming content: ${dto.content?.toString() ?? ''}`);
    const formattedContent = this.convertExcelToDocmostTable(dto.content);

    const createPageDto: CreatePageDto = {
      title: dto.title?.trim() || 'Sheet Auto Saved',
      spaceId,
      content: formattedContent,
      format: 'json',
    };

    return this.pageService.create(actorId, workspaceId, createPageDto);
  }

  async updatePage(pageId: string, dto: UpdateZeaAtlasPageDto) {
    const page = await this.pageService.findById(pageId, true, false, true);
    if (!page || page.deletedAt) {
      throw new NotFoundException('Page not found');
    }

    const requestedActorId = isUuid(dto.userId)
      ? dto.userId?.trim()
      : isUuid(dto.createdBy)
        ? dto.createdBy?.trim()
        : null;
    const requestedUser = requestedActorId
      ? await this.db
          .selectFrom('users')
          .selectAll()
          .where('id', '=', requestedActorId)
          .where('workspaceId', '=', page.workspaceId)
          .where('deletedAt', 'is', null)
          .executeTakeFirst()
      : null;

    const fallbackUser = requestedUser
      ? null
      : await this.db
          .selectFrom('users')
          .selectAll()
          .where('workspaceId', '=', page.workspaceId)
          .where('deletedAt', 'is', null)
          .orderBy('createdAt', 'asc')
          .executeTakeFirst();

    const actor = requestedUser ?? fallbackUser;
    if (!actor) {
      throw new NotFoundException('No user found to update page');
    }

    this.logger.log(`Incoming content: ${dto.content?.toString() ?? ''}`);
    const formattedContent = this.convertExcelToDocmostTable(dto.content);

    const updatePageDto: UpdatePageDto = {
      pageId,
      title: dto.title?.trim() || page.title,
      content: formattedContent,
      format: 'json',
      operation: 'replace',
    };

    return this.pageService.update(page, updatePageDto, actor as any);
  }

  async getPage(pageId: string) {
    const page = await this.pageService.findById(pageId, true, false, false);
    if (!page || page.deletedAt) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }
}
