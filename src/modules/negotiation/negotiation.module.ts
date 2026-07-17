import { Module } from '@nitrostack/core';
import { NegotiationTools } from './negotiation.tools.js';
import { NegotiationResources } from './negotiation.resources.js';
import { NegotiationPrompts } from './negotiation.prompts.js';

@Module({
  name: 'negotiation',
  description: 'TODO: Add description',
  controllers: [NegotiationTools, NegotiationResources, NegotiationPrompts],
})
export class NegotiationModule {}
