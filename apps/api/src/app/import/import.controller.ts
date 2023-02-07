import { ConfigurationService } from '@ghostfolio/api/services/configuration.service';
import { DataGatheringService } from '@ghostfolio/api/services/data-gathering.service';
import { PrismaService } from '@ghostfolio/api/services/prisma.service';
import type { RequestWithUser } from '@ghostfolio/common/types';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Res,
  UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Prisma } from '@prisma/client';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { ImportDataDto } from './import-data.dto';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
  public constructor(
    private readonly configurationService: ConfigurationService,
    private readonly importService: ImportService,
    private readonly dataGatheringService: DataGatheringService,
    private readonly prismaService: PrismaService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) { }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  public async import(@Body() importData: ImportDataDto): Promise<void> {
    if (!this.configurationService.get('ENABLE_FEATURE_IMPORT')) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.FORBIDDEN),
        StatusCodes.FORBIDDEN
      );
    }

    let maxActivitiesToImport = this.configurationService.get(
      'MAX_ACTIVITIES_TO_IMPORT'
    );

    if (
      this.configurationService.get('ENABLE_FEATURE_SUBSCRIPTION') &&
      this.request.user.subscription.type === 'Premium'
    ) {
      maxActivitiesToImport = Number.MAX_SAFE_INTEGER;
    }

    try {
      return await this.importService.import({
        maxActivitiesToImport,
        activities: importData.activities,
        userId: this.request.user.id
      });
    } catch (error) {
      Logger.error(error, ImportController);

      throw new HttpException(
        {
          error: getReasonPhrase(StatusCodes.BAD_REQUEST),
          message: [error.message]
        },
        StatusCodes.BAD_REQUEST
      );
    }
  }

  @Post('csv')
  @UseGuards(AuthGuard('jwt'))
  public async importCSV(@Body() bodyData, @Res() res: Response) {

    return this.importService.importCSV(bodyData, res);

  }

}
