'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateTimetable } from '@/ai/flows/generate-timetable-from-constraints';
import { Wand2 } from 'lucide-react';
import { ROOMS, TEACHERS, CLASSES } from '@/lib/constants';
import { Card, CardContent } from '../ui/card';

const AIGeneratorSchema = z.object({
  unavailableSlots: z.string().optional(),
});

export default function AIGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const form = useForm<z.infer<typeof AIGeneratorSchema>>({
    resolver: zodResolver(AIGeneratorSchema),
  });

  async function onSubmit(data: z.infer<typeof AIGeneratorSchema>) {
    setIsGenerating(true);
    setResult(null);
    try {
      const unavailableSlots = data.unavailableSlots
        ?.split('\n')
        .map(s => s.trim())
        .filter(Boolean) || [];

      const timetableInput = {
        rooms: Object.values(ROOMS),
        teachers: TEACHERS,
        classes: CLASSES,
        unavailableSlots,
      };

      const generated = await generateTimetable(timetableInput);
      setResult(generated);
      toast({
        title: 'AI 생성 완료',
        description: '시간표 초안이 생성되었습니다. 결과를 확인해주세요.',
      });
    } catch (error) {
      console.error('AI generation failed', error);
      toast({
        variant: 'destructive',
        title: 'AI 생성 실패',
        description: '시간표를 생성하는 중 오류가 발생했습니다.',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="unavailableSlots"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사용 불가 시간</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="예: 과학실-월-1 (한 줄에 하나씩 입력)"
                    className="min-h-[100px] font-code"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  AI가 배정에서 제외할 시간 슬롯을 입력합니다. (장소-요일-교시)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isGenerating}>
            <Wand2 className="mr-2 h-4 w-4" />
            {isGenerating ? '생성 중...' : 'AI로 시간표 초안 생성'}
          </Button>
        </form>
      </Form>
      {result && (
        <Card className="mt-6 bg-gray-50">
            <CardContent className="p-4">
                <h4 className="font-bold mb-2">생성 결과</h4>
                <pre className="text-xs p-4 bg-white rounded-md border max-h-[400px] overflow-auto font-code">
                    {JSON.stringify(result, null, 2)}
                </pre>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
