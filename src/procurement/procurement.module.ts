import { Module } from '@nitrostack/core';
import { ProcurementTools } from './procurement.tools.js';

@Module({
  name: 'procurement',
  description: 'Procurement intake parsing and vendor ranking tools',
  controllers: [ProcurementTools],
})
export class ProcurementModule {}
