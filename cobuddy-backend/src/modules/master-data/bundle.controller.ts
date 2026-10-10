import { Controller, Get } from '@nestjs/common';
import { AllowModule } from '@/common/decorators/auth.decorators';
import { MasterDataService } from './master-data.service';

@Controller('master-data/bundle')
export class BundleController {
  constructor(private service: MasterDataService) {}

  @Get()
  @AllowModule('system.masterData')
  async getBundle() {
    const data = await this.service.getBundle();
    return { data, message: 'Master data bundle fetched' };
  }
}
