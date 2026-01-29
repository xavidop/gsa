'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { handleGradeRequest } from '@/lib/actions';
import { DigitalSlab } from '@/components/digital-slab';
import type { GradedCard } from '@/lib/types';
import Link from 'next/link';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const formSchema = z.object({
  frontImage: z
    .any()
    .refine((files) => files?.length == 1, 'Front image is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  backImage: z
    .any()
    .refine((files) => files?.length == 1, 'Back image is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
});

type GradingFormValues = z.infer<typeof formSchema>;

export default function GradePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [gradedCard, setGradedCard] = useState<GradedCard | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<GradingFormValues>({
    resolver: zodResolver(formSchema),
  });
  
  const frontFileRef = form.register("frontImage");
  const backFileRef = form.register("backImage");

  const onSubmit = async (data: GradingFormValues) => {
    setIsLoading(true);
    setGradedCard(null);

    const formData = new FormData();
    formData.append('frontImage', data.frontImage[0]);
    formData.append('backImage', data.backImage[0]);

    try {
      const result = await handleGradeRequest(formData);
      if (result.error) {
        throw new Error(result.error);
      }
      if (result.card) {
        setGradedCard(result.card);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Grading Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') setFrontPreview(reader.result as string);
        else setBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (gradedCard) {
    return (
        <div className="container py-12 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline mb-2">Grading Complete!</h1>
            <p className="text-muted-foreground mb-8">Your card has been successfully graded by GSA.</p>
            <div className="flex justify-center">
                <DigitalSlab card={gradedCard} isPublicPage={true} />
            </div>
             <div className="mt-8 flex justify-center gap-4">
                <Button asChild>
                    <Link href={`/card/${gradedCard.publicId}`}>View Public Page</Link>
                </Button>
                <Button variant="outline" onClick={() => {
                    setGradedCard(null);
                    setFrontPreview(null);
                    setBackPreview(null);
                    form.reset();
                }}>
                    Grade Another Card
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Grade a New Card</CardTitle>
          <CardDescription>
            Upload front and back images of your trading card to receive an AI-powered grade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="frontImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Front of Card</FormLabel>
                      <FormControl>
                        <div className="relative w-full h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                          {frontPreview ? (
                            <Image src={frontPreview} alt="Front preview" layout="fill" objectFit="contain" className="p-2"/>
                          ) : (
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12" />
                                <p>Click to upload or drag & drop</p>
                            </div>
                          )}
                           <Input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            {...frontFileRef}
                            onChange={(e) => handleFileChange(e, 'front')}
                            />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="backImage"
                  render={({ field }) => (
                     <FormItem>
                      <FormLabel>Back of Card</FormLabel>
                      <FormControl>
                        <div className="relative w-full h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                          {backPreview ? (
                            <Image src={backPreview} alt="Back preview" layout="fill" objectFit="contain" className="p-2"/>
                          ) : (
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12" />
                                <p>Click to upload or drag & drop</p>
                            </div>
                          )}
                           <Input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            {...backFileRef}
                             onChange={(e) => handleFileChange(e, 'back')}
                            />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Grading in Progress...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start AI Grading
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
