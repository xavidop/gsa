'use server';

import { auth, db, storage } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type { GradedCard } from './types';

// This is a mock AI grading function. In a real scenario, this would
// call the Genkit flow with Gemini Pro Vision.
async function performAIGrading(frontImageUrl: string, backImageUrl: string): Promise<Omit<GradedCard, 'id' | 'userId' | 'frontImageUrl' | 'backImageUrl' | 'createdAt' | 'publicId'>> {
  
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
  
    // Simulate AI response - structured output
    const randomGrade = Math.floor(Math.random() * 4) + 7; // Grade between 7 and 10
    
    return {
      cardName: 'Amazing Charizard',
      set: 'Vivid Voltage',
      grade: randomGrade,
      subgrades: {
        centering: Math.random() > 0.5 ? 10 : 9.5,
        corners: Math.random() > 0.5 ? 10 : 9.5,
        edges: Math.random() > 0.5 ? 9.5 : 9,
        surface: Math.random() > 0.5 ? 10 : 9,
      },
      confidence: Math.random() * 0.1 + 0.9, // 90% - 99%
      year: '2020',
    };
}


export async function handleGradeRequest(formData: FormData): Promise<{ card?: GradedCard; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to grade a card.');
    }

    const frontImage = formData.get('frontImage') as File | null;
    const backImage = formData.get('backImage') as File | null;

    if (!frontImage || !backImage) {
      throw new Error('Front and back images are required.');
    }

    const publicId = uuidv4().slice(0, 8);
    
    // 1. Upload images to Firebase Storage
    const frontImageRef = ref(storage, `cards/${user.uid}/${publicId}/front.webp`);
    await uploadBytes(frontImageRef, frontImage);
    const frontImageUrl = await getDownloadURL(frontImageRef);

    const backImageRef = ref(storage, `cards/${user.uid}/${publicId}/back.webp`);
    await uploadBytes(backImageRef, backImage);
    const backImageUrl = await getDownloadURL(backImageRef);
    
    // 2. Perform AI Grading
    const gradingResult = await performAIGrading(frontImageUrl, backImageUrl);

    // 3. Create document in Firestore
    const cardData: Omit<GradedCard, 'id'> = {
      userId: user.uid,
      frontImageUrl,
      backImageUrl,
      ...gradingResult,
      createdAt: serverTimestamp(),
      publicId: publicId,
    };

    const docRef = await addDoc(collection(db, 'cards'), cardData);
    
    const finalCard: GradedCard = {
        ...cardData,
        id: docRef.id,
        createdAt: new Date(), // for client-side display
    };

    return { card: finalCard };

  } catch (error: any) {
    console.error('Error in handleGradeRequest:', error);
    return { error: error.message || 'An unknown error occurred during grading.' };
  }
}
