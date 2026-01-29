# **App Name**: Global Slab Authority

## Core Features:

- User Authentication: Secure user authentication and registration using Firebase Auth.
- Card Image Upload and Storage: Upload and store front and back images of trading cards to Firebase Storage, linking metadata and AI grading results in Firestore.
- AI-Powered Grading: Leverage Genkit and Gemini Pro Vision to automatically analyze card images, detect card type and condition, and provide overall grade and subgrades (centering, corners, edges, surface) using structured output validation. The LLM will act as a tool, leveraging vision models.
- Digital Slab Generation: Dynamically generate an animated digital slab UI to display the card image, GSA grade, and subgrades with subtle animations.
- QR Code Generation & Sharing: Generate QR codes for each graded card, linking to a public read-only grading page displaying card images, grades, and GSA branding.
- Private User Dashboard: Allow users to see all of their previously graded cards.
- Public Sharing Page: Enable a public page that contains the Slab animation, images and grades.

## Style Guidelines:

- Primary color: Deep blue (#293462) to evoke a sense of authority and reliability, akin to established grading services. This choice moves away from literal interpretations and focuses on conveying trust.
- Background color: Very dark, desaturated blue (#1A1B26), creating a dark mode-friendly aesthetic that highlights the graded cards.
- Accent color: A vibrant, contrasting gold (#FFD700) for the grading scores and highlights, signifying premium quality and collectible status. The gold will stand out in the dark palette.
- Body: 'Inter', sans-serif, modern and clean feel for comfortable reading of grades and card information
- Headings: 'Space Grotesk', sans-serif, for a modern techy look appropriate for headers and sub-headers
- Code font: 'Source Code Pro' for displaying any technical details or data snippets.
- Use premium, minimalist icons for subgrades (centering, corners, etc.) to enhance the collectible aesthetic.
- Clean and modern layout with a focus on card display. Utilize grid and flexbox for responsive design.
- Subtle animations on the digital slab (idle/hover) to bring the cards to life.