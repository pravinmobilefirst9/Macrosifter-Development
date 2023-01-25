import { environment } from '@ghostfolio/api/environments/environment';
import { PrismaService } from '@ghostfolio/api/services/prisma.service';
import { Export } from '@ghostfolio/common/interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportService {
  public constructor(private readonly prismaService: PrismaService) { }

  public async export({
    activityIds,
    userId
  }: {
    activityIds?: string[];
    userId: string;
  }): Promise<Export> {
    let activities = await this.prismaService.order.findMany({
      orderBy: { date: 'desc' },
      select: {
        accountId: true,
        comment: true,
        date: true,
        fee: true,
        id: true,
        quantity: true,
        SymbolProfile: true,
        type: true,
        subtype: true,
        dividendpershare_at_cost: true,
        unitPrice: true
      },
      where: { userId }
    });

    if (activityIds) {
      activities = activities.filter((activity) => {
        return activityIds.includes(activity.id);
      });
    }

    return {
      meta: { date: new Date().toISOString(), version: environment.version },
      activities: activities.map(
        ({
          accountId,
          comment,
          date,
          dividendpershare_at_cost,
          fee,
          id,
          quantity,
          SymbolProfile,
          type,
          subtype,
          unitPrice,
        }) => {
          return {
            accountId,
            comment,
            fee,
            id,
            quantity,
            dividendpershare_at_cost,
            type,
            subtype,
            unitPrice,
            currency: SymbolProfile.currency,
            dataSource: SymbolProfile.dataSource,
            date: date.toISOString(),
            symbol: type === 'ITEM' ? SymbolProfile.name : SymbolProfile.symbol
          };
        }
      )
    };
  }
}
