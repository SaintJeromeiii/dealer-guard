import type { TrapCard } from '../utils/types';

export const trapCards: TrapCard[] = [
  {
    title: 'Monthly payment trap',
    danger: 'They focus on your monthly payment instead of total price.',
    why: 'A lower payment can hide a longer loan, higher interest, or extra fees.',
    response: 'I want the full out-the-door price first, not just the monthly payment.',
  },
  {
    title: 'Today-only pressure',
    danger: 'They say the deal is only good right now.',
    why: 'Urgency is often used to stop comparison shopping and clear thinking.',
    response: 'If the deal is fair, I can review it carefully and come back.',
  },
  {
    title: 'Add-on packing',
    danger: 'They slip in warranties, protection packages, or accessories.',
    why: 'Add-ons can add thousands in markup.',
    response: 'Please itemize every add-on and remove anything optional.',
  },
  {
    title: 'Trade-in confusion',
    danger: 'They mix your trade-in, vehicle price, and financing together.',
    why: 'That makes it harder to see whether you are actually getting a fair deal.',
    response: "Let's separate the vehicle price, trade-in, and financing one at a time.",
  },
  {
    title: 'Rate markup',
    danger: 'They present financing as if it is your only option.',
    why: 'A marked-up APR can cost a lot over time.',
    response: 'I know my outside financing options. Show me your best rate in writing.',
  },
  {
    title: 'Wear-down tactic',
    danger: 'They keep you there for hours to wear you down.',
    why: 'Tired buyers make weaker decisions.',
    response: "I'm leaving for now. I only make financial decisions when I have time to review them.",
  },
];