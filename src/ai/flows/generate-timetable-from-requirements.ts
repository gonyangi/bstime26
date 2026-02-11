'use server';

/**
 * @fileOverview An AI agent for generating timetables based on requirements.
 * This file exports:
 *
 * - `generateTimetable`: A function to generate a timetable proposal.
 * - `TimetableInput`: The input type for the generateTimetable function.
 * - `TimetableOutput`: The return type for the generateTimetable function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TimetableInputSchema = z.object({
  rooms: z
    .array(z.string())
    .describe('An array of available rooms.'),
  teachers: z
    .array(z.string())
    .describe('An array of available teachers.'),
  classes: z
    .array(z.string())
    .describe('An array of classes to schedule.'),
  unavailableSlots: z
    .array(z.string())
    .describe(
      'An array of unavailable time slots, formatted as "Day, Time" e.g., "Monday, 9:00-10:00".'
    ),
  additionalConstraints: z
    .string()
    .optional()
    .describe('Any additional constraints or preferences for the timetable.'),
});
export type TimetableInput = z.infer<typeof TimetableInputSchema>;

const TimetableOutputSchema = z.object({
  timetableProposal: z
    .string()
    .describe('A proposed timetable in a readable format.'),
});
export type TimetableOutput = z.infer<typeof TimetableOutputSchema>;

export async function generateTimetable(input: TimetableInput): Promise<TimetableOutput> {
  return generateTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTimetablePrompt',
  input: {schema: TimetableInputSchema},
  output: {schema: TimetableOutputSchema},
  prompt: `You are a timetable generation expert. Your goal is to create a feasible timetable proposal, given the available resources and constraints.

Available Rooms: {{{rooms}}}
Available Teachers: {{{teachers}}}
Classes to Schedule: {{{classes}}}
Unavailable Slots: {{{unavailableSlots}}}
Additional Constraints: {{{additionalConstraints}}}

Propose a timetable that respects all constraints and efficiently utilizes the available resources. Return the timetable in a clear, readable format.

Timetable Proposal: `,
});

const generateTimetableFlow = ai.defineFlow(
  {
    name: 'generateTimetableFlow',
    inputSchema: TimetableInputSchema,
    outputSchema: TimetableOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
