/**
 * Computer Vision Quality Grading Component
 * AI-powered photo-based quality assessment for produce
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, AlertTriangle, Star, Upload, Zap } from "lucide-react";
import { formatKsh } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface QualityAssessment {
  grade: "A" | "B" | "C";
  score: number;
  confidence: number;
  defects: string[];
  ripeness: number;
  size: string;
  color: string;
  uniformity: number;
  recommendedPrice: number;
  marketAverage: number;
  pricePremium: number;
}

const MOCK_ASSESSMENT: QualityAssessment = {
  grade: "A",
  score: 92,
  confidence: 95,
  defects: [],
  ripeness: 85,
  size: "Large (80-100g)",
  color: "Deep Red",
  uniformity: 90,
  recommendedPrice: 110,
  marketAverage: 95,
  pricePremium: 15,
};

const MOCK_HISTORY = [
  { date: "2024-01-15", grade: "A", score: 92, price: 110 },
  { date: "2024-01-08", grade: "A", score: 88, price: 105 },
  { date: "2023-12-20", grade: "B", score: 75, price: 85 },
];

export function ComputerVisionQualityGrading() {
  const [hasImage, setHasImage] = useState(true); // Mock: image already uploaded

  const getGradeColor = (grade: string) => {
    if (grade === "A") return "bg-green-100 text-green-700 border-green-300";
    if (grade === "B") return "bg-blue-100 text-blue-700 border-blue-300";
    return "bg-yellow-100 text-yellow-700 border-yellow-300";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              Computer Vision Quality Grading
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>AI-powered photo-based quality assessment</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        {!hasImage ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="font-semibold mb-2">Upload Produce Photo</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Take a clear photo of your produce for instant AI quality grading
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>
        ) : (
          <>
            {/* Image Preview */}
            <div className="relative border rounded-lg overflow-hidden">
              <div className="bg-gradient-to-br from-red-100 to-orange-100 h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">🍅</div>
                  <p className="text-sm text-muted-foreground">Sample Tomato Image</p>
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-600 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Analyzed
                </Badge>
              </div>
            </div>

            {/* Quality Grade Result */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm text-green-700 mb-1">Quality Grade</h4>
                  <div className="flex items-center gap-3">
                    <div className="text-5xl font-bold text-green-600">
                      {MOCK_ASSESSMENT.grade}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-green-700">Premium Quality</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700 mb-1">Quality Score</p>
                  <p className="text-4xl font-bold text-green-600">{MOCK_ASSESSMENT.score}</p>
                  <p className="text-xs text-green-600">out of 100</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">AI Confidence</span>
                  <span className="font-semibold">{MOCK_ASSESSMENT.confidence}%</span>
                </div>
                <Progress value={MOCK_ASSESSMENT.confidence} className="h-2" />
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quality Metrics */}
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Quality Metrics
                </h5>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Ripeness</span>
                      <span className="font-semibold">{MOCK_ASSESSMENT.ripeness}%</span>
                    </div>
                    <Progress value={MOCK_ASSESSMENT.ripeness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Uniformity</span>
                      <span className="font-semibold">{MOCK_ASSESSMENT.uniformity}%</span>
                    </div>
                    <Progress value={MOCK_ASSESSMENT.uniformity} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-muted-foreground">Size</p>
                      <p className="font-semibold text-sm">{MOCK_ASSESSMENT.size}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="font-semibold text-sm">{MOCK_ASSESSMENT.color}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Defect Detection */}
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Defect Detection
                </h5>
                {MOCK_ASSESSMENT.defects.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold text-green-900">No Defects Detected</p>
                    <p className="text-sm text-green-700 mt-1">
                      Your produce is in excellent condition
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {MOCK_ASSESSMENT.defects.map((defect, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm bg-red-50 rounded p-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                        <span>{defect}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Recommendation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-semibold text-blue-900 mb-4">💰 AI Pricing Recommendation</h5>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Market Average</p>
                  <p className="text-xl font-bold">{formatKsh(MOCK_ASSESSMENT.marketAverage)}</p>
                </div>
                <div className="bg-green-100 border border-green-300 rounded p-3 text-center">
                  <p className="text-xs text-green-700 mb-1">Recommended Price</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatKsh(MOCK_ASSESSMENT.recommendedPrice)}
                  </p>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Premium</p>
                  <p className="text-xl font-bold text-green-600">
                    +{MOCK_ASSESSMENT.pricePremium}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-700">
                Based on Grade {MOCK_ASSESSMENT.grade} quality, you can charge{" "}
                <span className="font-bold">{MOCK_ASSESSMENT.pricePremium}% above market average</span>.
                Buyers will pay premium for verified quality.
              </p>
            </div>

            {/* Quality Certificate */}
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-purple-900 mb-1">
                    🏆 Quality Certificate
                  </h5>
                  <p className="text-sm text-purple-700">
                    Share this certificate with buyers to build trust
                  </p>
                </div>
                <Badge className="bg-purple-600 text-white">
                  Verified
                </Badge>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Certificate ID:</span>
                  <span className="text-sm text-muted-foreground">QC-2024-001234</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Grade:</span>
                  <Badge className={getGradeColor(MOCK_ASSESSMENT.grade)}>
                    Grade {MOCK_ASSESSMENT.grade}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Verified:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button variant="outline" size="sm">
                  Download Certificate
                </Button>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Share with Buyers
                </Button>
              </div>
            </div>

            {/* Quality History */}
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold mb-3">📊 Your Quality History</h5>
              <div className="space-y-2">
                {MOCK_HISTORY.map((record, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 rounded p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getGradeColor(record.grade)} variant="outline">
                        {record.grade}
                      </Badge>
                      <div>
                        <p className="text-sm font-semibold">Score: {record.score}</p>
                        <p className="text-xs text-muted-foreground">{record.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatKsh(record.price)}</p>
                      <p className="text-xs text-muted-foreground">Price achieved</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                    <p className="text-xs text-muted-foreground">Grade A Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">88</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">+12%</p>
                    <p className="text-xs text-muted-foreground">Avg Premium</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setHasImage(false)}>
                <Camera className="h-4 w-4 mr-2" />
                Grade Another Batch
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                List at Recommended Price
              </Button>
            </div>
          </>
        )}

        {/* How It Works */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-semibold text-purple-900 mb-3">🤖 How AI Quality Grading Works</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-purple-700">
            <div className="flex items-start gap-2">
              <Camera className="h-4 w-4 mt-0.5" />
              <span><strong>1. Photo Analysis:</strong> AI scans your produce image</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5" />
              <span><strong>2. Defect Detection:</strong> Identifies blemishes, rot, damage</span>
            </div>
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5" />
              <span><strong>3. Quality Scoring:</strong> Grades based on size, color, ripeness</span>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5" />
              <span><strong>4. Price Recommendation:</strong> Suggests optimal pricing</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
