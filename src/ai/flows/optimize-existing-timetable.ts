'use server';

/**
 * @fileOverview An AI agent for optimizing an existing timetable.
 * This file exports:
 *
 * - `optimizeTimetable`: A function to optimize a timetable proposal.
 * - `OptimizeTimetableInput`: The input type for the optimizeTimetable function.
 * - `OptimizeTimetableOutput`: The return type for the optimizeTimetable function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeTimetableInputSchema = z.object({
  timetableData: z.string().describe('The existing timetable data in JSON format.'),
  rooms: z
    .array(z.string())
    .describe('An array of available rooms.'),
  teachers: z
    .array(z.string())
    .describe('An array of available teachers.'),
  classes: z
    .array(z.string())
    .describe('An array of classes to schedule.'),
});
export type OptimizeTimetableInput = z.infer<typeof OptimizeTimetableInputSchema>;

const OptimizeTimetableOutputSchema = z.object({
  optimizedTimetable: z.string().describe('The optimized timetable data in JSON format.'),
  suggestions: z.array(z.string()).describe('An array of suggestions for improvement.'),
});
export type OptimizeTimetableOutput = z.infer<typeof OptimizeTimetableOutputSchema>;

export async function optimizeTimetable(input: OptimizeTimetableInput): Promise<OptimizeTimetableOutput> {
  return optimizeTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeTimetablePrompt',
  input: {schema: OptimizeTimetableInputSchema},
  output: {schema: OptimizeTimetableOutputSchema},
  prompt: `You are an expert in optimizing school timetables. Given an existing timetable, you will analyze it for conflicts, inefficient resource allocation, and other potential improvements.

  Existing Timetable Data: {{{timetableData}}}
  Available Rooms: {{{rooms}}}
  Available Teachers: {{{teachers}}}
  Classes: {{{classes}}}

  Provide an optimized timetable in JSON format, along with a list of specific suggestions for improvement.
  The optimized timetable should minimize conflicts and make efficient use of available resources.
  Make sure that all the original classes are included.
  Make sure the output is valid JSON.
  Do not include any additional explanation, only output JSON.`,
});

const optimizeTimetableFlow = ai.defineFlow(
  {
    name: 'optimizeTimetableFlow',
    inputSchema: OptimizeTimetableInputSchema,
    outputSchema: OptimizeTimetableOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
