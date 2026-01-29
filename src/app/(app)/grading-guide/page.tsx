'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const gradeScale = [
  {
    grade: 10,
    name: 'GEM MINT',
    description: 'A card with perfect centering, sharp corners, pristine edges and flawless surface.',
    color: 'bg-emerald-500',
    criteria: {
      centering: '50/50 to 55/45',
      corners: 'Sharp with no wear',
      edges: 'Perfect with no wear',
      surface: 'No print defects, scratches, or damage',
    },
  },
  {
    grade: 9,
    name: 'MINT',
    description: 'A superb condition card with only minor imperfections.',
    color: 'bg-green-500',
    criteria: {
      centering: '55/45 to 60/40',
      corners: 'Sharp to slightly touched',
      edges: 'Virtually perfect',
      surface: 'Minor print defect allowed',
    },
  },
  {
    grade: 8,
    name: 'NM-MT',
    description: 'Near Mint-Mint condition with very minor wear.',
    color: 'bg-lime-500',
    criteria: {
      centering: '60/40 to 65/35',
      corners: 'Slightly touched to fuzzy',
      edges: 'Minor wear visible',
      surface: 'Minor scratches or print lines',
    },
  },
  {
    grade: 7,
    name: 'NEAR MINT',
    description: 'A card with slight surface wear visible upon close inspection.',
    color: 'bg-yellow-500',
    criteria: {
      centering: '65/35 to 70/30',
      corners: 'Fuzzy with minor wear',
      edges: 'Slight fraying visible',
      surface: 'Light scratches or minor print defects',
    },
  },
  {
    grade: 6,
    name: 'EX-MT',
    description: 'Excellent-Mint with minor rounding and wear.',
    color: 'bg-orange-400',
    criteria: {
      centering: '70/30 to 75/25',
      corners: 'Minor rounding',
      edges: 'Minor edge wear',
      surface: 'Light surface wear visible',
    },
  },
  {
    grade: 5,
    name: 'EXCELLENT',
    description: 'A card with noticeable but moderate wear.',
    color: 'bg-orange-500',
    criteria: {
      centering: '75/25 to 80/20',
      corners: 'Moderate rounding',
      edges: 'Moderate edge wear',
      surface: 'Noticeable surface wear',
    },
  },
  {
    grade: 4,
    name: 'VG-EX',
    description: 'Very Good-Excellent with significant wear but still desirable.',
    color: 'bg-red-400',
    criteria: {
      centering: '80/20 to 85/15',
      corners: 'Rounding and wear visible',
      edges: 'Significant fraying',
      surface: 'Multiple scratches or wear',
    },
  },
  {
    grade: 3,
    name: 'VERY GOOD',
    description: 'A card showing obvious wear and handling.',
    color: 'bg-red-500',
    criteria: {
      centering: '85/15 to 90/10',
      corners: 'Rounded corners',
      edges: 'Obvious edge wear',
      surface: 'Creases or heavy scratches',
    },
  },
  {
    grade: 2,
    name: 'GOOD',
    description: 'A card with severe wear but still intact.',
    color: 'bg-red-600',
    criteria: {
      centering: '90/10 or worse',
      corners: 'Heavily rounded or damaged',
      edges: 'Severe edge wear',
      surface: 'Major creases, stains, or damage',
    },
  },
  {
    grade: 1,
    name: 'POOR',
    description: 'A card with extreme wear and damage.',
    color: 'bg-red-700',
    criteria: {
      centering: 'Poor centering',
      corners: 'Extreme rounding or damage',
      edges: 'Extreme wear or damage',
      surface: 'Severe damage, writing, or defacement',
    },
  },
];

const gradingFactors = [
  {
    factor: 'Centering',
    description: 'The alignment of the image within the card borders. Measured by the ratio of borders on opposite sides.',
    examples: [
      { quality: 'Perfect', detail: '50/50 (equal borders on all sides)' },
      { quality: 'Excellent', detail: '55/45 to 60/40' },
      { quality: 'Good', detail: '65/35 to 75/25' },
      { quality: 'Poor', detail: '80/20 or worse' },
    ],
  },
  {
    factor: 'Corners',
    description: 'The sharpness and condition of all four corners of the card.',
    examples: [
      { quality: 'Sharp', detail: 'Perfectly pointed with no visible wear' },
      { quality: 'Touched', detail: 'Slight wear at the tip' },
      { quality: 'Fuzzy', detail: 'Minor rounding visible' },
      { quality: 'Rounded', detail: 'Obvious rounding and wear' },
    ],
  },
  {
    factor: 'Edges',
    description: 'The condition of all four edges, looking for wear, fraying, or damage.',
    examples: [
      { quality: 'Perfect', detail: 'No visible wear under magnification' },
      { quality: 'Minor Wear', detail: 'Slight fraying visible' },
      { quality: 'Moderate Wear', detail: 'Noticeable edge wear' },
      { quality: 'Heavy Wear', detail: 'Significant fraying or damage' },
    ],
  },
  {
    factor: 'Surface',
    description: 'The front and back surface condition, checking for scratches, print defects, stains, or other damage.',
    examples: [
      { quality: 'Flawless', detail: 'No scratches, print lines, or defects' },
      { quality: 'Minor Defects', detail: 'Slight print lines or minor scratches' },
      { quality: 'Moderate Defects', detail: 'Visible scratches or print issues' },
      { quality: 'Heavy Defects', detail: 'Creases, stains, or major damage' },
    ],
  },
];

export default function GradingGuidePage() {
  return (
    <div className="container py-6 sm:py-8 max-w-7xl px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-headline mb-2">Grading Standards Guide</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Understanding our professional card grading process and criteria
        </p>
      </div>

      <Tabs defaultValue="scale" className="space-y-6 sm:space-y-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="scale">Grade Scale</TabsTrigger>
          <TabsTrigger value="factors">Grading Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="scale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>The 10-Point Grading Scale</CardTitle>
              <CardDescription>
                Each card is evaluated on a scale from 1 (Poor) to 10 (Gem Mint) based on four key factors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gradeScale.map((item) => (
                <div key={item.grade} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`${item.color} text-white font-bold text-lg px-4 py-1`}>
                      {item.grade}
                    </Badge>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Centering:</span>
                      <p className="text-sm">{item.criteria.centering}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Corners:</span>
                      <p className="text-sm">{item.criteria.corners}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Edges:</span>
                      <p className="text-sm">{item.criteria.edges}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Surface:</span>
                      <p className="text-sm">{item.criteria.surface}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Grading Factors</CardTitle>
              <CardDescription>
                Detailed breakdown of the four key factors that determine a card's grade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {gradingFactors.map((item) => (
                <div key={item.factor} className="space-y-3">
                  <div>
                    <h3 className="font-bold text-xl mb-1">{item.factor}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.examples.map((example) => (
                      <div key={example.quality} className="border rounded-md p-3">
                        <div className="font-medium">{example.quality}</div>
                        <div className="text-sm text-muted-foreground">{example.detail}</div>
                      </div>
                    ))}
                  </div>
                  {item !== gradingFactors[gradingFactors.length - 1] && (
                    <div className="border-b pt-3" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overall Grade Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The overall grade is determined by evaluating all four factors together. A card cannot receive a grade higher than its lowest individual factor score in most cases.
              </p>
              <div className="space-y-2">
                <h4 className="font-medium">Example:</h4>
                <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Centering: <span className="font-medium">9</span></div>
                    <div>Corners: <span className="font-medium">10</span></div>
                    <div>Edges: <span className="font-medium">9</span></div>
                    <div>Surface: <span className="font-medium">8</span></div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="font-bold">Overall Grade: 8 (NM-MT)</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Limited by the surface grade, despite higher scores in other areas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Always handle cards by the edges to avoid fingerprints and surface damage</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Store cards in protective sleeves and top-loaders immediately after opening</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Examine cards under good lighting to identify print defects and surface issues</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Use a magnifying glass or loupe to inspect corners and edges closely</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Vintage cards (pre-1980) are often graded more leniently due to production quality</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Modern cards (post-2000) typically require near-perfect condition for high grades</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
