import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RestaurantService } from './restaurant.service';
import { RegisterRestaurantDto } from './dto/register-restaurant.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('restaurants')
@UseGuards(ApiKeyGuard, JwtGuard)
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get('tenants')
  listTenants(@Req() request: any) {
    return this.restaurantService.listTenants(request.user.sub);
  }

  @Get('tenants/:id')
  getTenant(@Req() request: any, @Param('id') id: string) {
    return this.restaurantService.getTenant(id, request.user.sub);
  }

  @Post('tenants')
  registerTenant(@Req() request: any, @Body() payload: RegisterRestaurantDto) {
    return this.restaurantService.registerTenant(request.user.sub, payload);
  }

  @Put('tenants/:id')
  updateTenant(
    @Req() request: any,
    @Param('id') id: string,
    @Body() payload: Partial<RegisterRestaurantDto>,
  ) {
    return this.restaurantService.updateTenant(id, request.user.sub, payload);
  }

  @Delete('tenants/:id')
  removeTenant(@Req() request: any, @Param('id') id: string) {
    return this.restaurantService.removeTenant(id, request.user.sub);
  }

  @Get('tenants/:tenantId/branches')
  listBranches(@Req() request: any, @Param('tenantId') tenantId: string) {
    return this.restaurantService.listBranches(tenantId, request.user.sub);
  }

  @Post('branches')
  createBranch(@Req() request: any, @Body() payload: CreateBranchDto) {
    return this.restaurantService.createBranch(request.user.sub, payload);
  }

  @Put('branches/:id')
  updateBranch(
    @Req() request: any,
    @Param('id') id: string,
    @Body() payload: UpdateBranchDto,
  ) {
    return this.restaurantService.updateBranch(id, request.user.sub, payload);
  }

  @Delete('branches/:id')
  removeBranch(@Req() request: any, @Param('id') id: string) {
    return this.restaurantService.removeBranch(id, request.user.sub);
  }
}
