import type { Question } from '../utils/types';

export const questions: Question[] = [
  {
    id: 'budget',
    title: 'What monthly payment feels safe for you?',
    subtitle: 'Pick a payment that still leaves room in your budget.',
    options: ['Under $300', '$300-$450', '$450-$600', '$600+', "I don't know yet"],
  },
  {
    id: 'downPayment',
    title: 'Do you have money saved for a down payment?',
    subtitle: 'Even a small down payment can reduce risk.',
    options: ['Yes', 'No', 'Not sure'],
  },
  {
    id: 'credit',
    title: 'Do you know your credit score range?',
    subtitle: 'Knowing your score range helps you judge whether the APR is fair.',
    options: ['Excellent', 'Good', 'Fair', 'Poor', "I don't know"],
  },
  {
    id: 'preapproved',
    title: 'Have you been pre-approved by a bank or credit union?',
    subtitle: 'Outside financing gives you leverage.',
    options: ['Yes', 'No', 'Working on it'],
  },
  {
    id: 'targetPrice',
    title: 'Do you know the fair market price of the car you want?',
    subtitle: 'Walking in blind makes it easier to overpay.',
    options: ['Yes', 'Somewhat', 'No'],
  },
  {
    id: 'tradeIn',
    title: 'Do you have a trade-in and know its value?',
    subtitle: 'Trade-in confusion can hide a bad deal.',
    options: ['No trade-in', 'Yes, and I know its value', "Yes, but I don't know its value"],
  },
  {
    id: 'walkAway',
    title: 'Do you know your maximum out-the-door price?',
    subtitle: 'This is your walk-away number.',
    options: ['Yes', 'No', 'I need help with that'],
  },
];