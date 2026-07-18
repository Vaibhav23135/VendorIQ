import { PromptDecorator as Prompt, ExecutionContext } from '@nitrostack/core';

/**
 * Negotiation Prompts
 *
 * Two guided prompts that onboard the user into the VendorIQ agentic
 * procurement workflow and kick off the negotiation flow.
 */
export class NegotiationPrompts {

  /**
   * start-procurement — Onboarding prompt that introduces the VendorIQ
   * agentic workflow and instructs the AI on the end-to-end process.
   */
  @Prompt({
    name: 'start-procurement',
    description:
      'Start a new procurement request. Guides the AI to walk the user through the full VendorIQ agentic workflow: intake parsing → validation → vendor ranking → product search → negotiation → PO generation.',
  })
  async startProcurementPrompt(args: Record<string, unknown>, context: ExecutionContext) {
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `I need help sourcing a product for my organization.`,
        },
      },
      {
        role: 'assistant' as const,
        content: {
          type: 'text' as const,
          text: `Welcome to **VendorIQ** — your AI-powered Procurement Intelligence Platform. I can help you source, rank, negotiate, and generate Purchase Orders for any procurement need.

Here's how the process works:

**Step 1 — Tell me what you need.** Describe your requirement in plain English, for example:
> *"Need 100 laptops with 16GB RAM and i7 processor, ₹55 lakh budget, delivery by 2026-08-15, urgent"*

**Step 2 — I'll parse and validate** your request, check it against market prices, and flag any budget or spec issues before proceeding.

**Step 3 — Vendor ranking** with automatic scenario detection. If you say "urgent" I weight delivery 65%. If you say "budget" I weight cost 65%. Medical procurement auto-prioritises compliance and quality.

**Step 4 — Product catalog search** to show you actual SKUs with specs (RAM, CPU, SSD, warranty) before you commit.

**Step 5 — Negotiation simulation** using the vendor's historical contracts to find the best price.

**Step 6 — PO generation** with a formatted purchase order and delivery timeline.

**What would you like to procure today?** Just describe your need in as much detail as you have — I'll handle the rest.`,
        },
      },
    ];
  }

  /**
   * negotiate-deal — Kicks off the negotiation flow for a selected vendor,
   * referencing their contract history and market context.
   */
  @Prompt({
    name: 'negotiate-deal',
    description:
      'Start a negotiation simulation for a selected vendor. Call this after rank-vendors has identified the top vendor. Pass the vendorId and item in the args.',
    arguments: [
      {
        name: 'vendorId',
        description: 'The vendor ID to negotiate with (e.g. V-DELL-01)',
        required: true,
      },
      {
        name: 'item',
        description: 'The item to purchase (e.g. Dell Latitude Laptop)',
        required: true,
      },
      {
        name: 'quantity',
        description: 'Number of units to purchase',
        required: true,
      },
    ],
  })
  async negotiateDealPrompt(args: Record<string, unknown>, context: ExecutionContext) {
    const vendorId = (args.vendorId as string) ?? 'the selected vendor';
    const item = (args.item as string) ?? 'the selected item';
    const quantity = (args.quantity as number) ?? 1;

    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Start a negotiation for ${quantity} units of ${item} with vendor ${vendorId}.`,
        },
      },
      {
        role: 'assistant' as const,
        content: {
          type: 'text' as const,
          text: `Great choice! Let me run the negotiation workflow for **${quantity}× ${item}** with **${vendorId}**.

Here's my plan:

1. 📋 **Fetch contract history** — I'll pull all past contracts with this vendor to understand their typical discount range and delivery reliability.

2. 💰 **Run 3-round negotiation simulation** — Using their historical pricing data and your order volume, I'll simulate:
   - **Round 1**: Vendor's standard opening offer
   - **Round 2**: Your counter-offer based on market pricing
   - **Round 3**: Final settled price with volume-based concessions + warranty extension

3. 📄 **Generate Purchase Order** — Once we agree on terms, I'll produce a structured PO document ready for your finance team.

Let me start by fetching the contract history for ${vendorId}...`,
        },
      },
    ];
  }
}
