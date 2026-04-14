/**
 * Gamification Dashboard Component
 * Achievements, leaderboards, badges, and farmer rewards system
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award, TrendingUp, Target, Zap, Crown, Medal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;
  points: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  level: number;
  badge: string;
  isCurrentUser?: boolean;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "1",
    title: "Market Master",
    description: "Sell at peak prices 10 times",
    icon: "🎯",
    progress: 7,
    total: 10,
    unlocked: false,
    points: 500,
  },
  {
    id: "2",
    title: "Early Bird",
    description: "Check prices before 7 AM for 7 days",
    icon: "🌅",
    progress: 7,
    total: 7,
    unlocked: true,
    points: 200,
  },
  {
    id: "3",
    title: "Profit Pro",
    description: "Achieve 40%+ profit margin 5 times",
    icon: "💰",
    progress: 3,
    total: 5,
    unlocked: false,
    points: 300,
  },
  {
    id: "4",
    title: "Weather Wise",
    description: "Use weather alerts to time sales 15 times",
    icon: "⛈️",
    progress: 12,
    total: 15,
    unlocked: false,
    points: 400,
  },
  {
    id: "5",
    title: "Quality Champion",
    description: "Sell Grade A produce 20 times",
    icon: "⭐",
    progress: 20,
    total: 20,
    unlocked: true,
    points: 600,
  },
  {
    id: "6",
    title: "Community Leader",
    description: "Help 10 farmers with market advice",
    icon: "🤝",
    progress: 5,
    total: 10,
    unlocked: false,
    points: 350,
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "John Kamau", points: 8500, level: 12, badge: "👑" },
  { rank: 2, name: "Mary Wanjiku", points: 7800, level: 11, badge: "🥈" },
  { rank: 3, name: "Peter Omondi", points: 7200, level: 10, badge: "🥉" },
  { rank: 4, name: "Grace Akinyi", points: 6500, level: 9, badge: "⭐" },
  { rank: 5, name: "You", points: 5800, level: 8, badge: "🌟", isCurrentUser: true },
  { rank: 6, name: "David Kipchoge", points: 5200, level: 8, badge: "🌟" },
  { rank: 7, name: "Sarah Njeri", points: 4800, level: 7, badge: "💫" },
];

export function GamificationDashboard() {
  const userLevel = 8;
  const userPoints = 5800;
  const pointsToNextLevel = 6500;
  const levelProgress = (userPoints / pointsToNextLevel) * 100;
  const unlockedAchievements = MOCK_ACHIEVEMENTS.filter(a => a.unlocked).length;
  const totalPoints = MOCK_ACHIEVEMENTS.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Farmer Achievements & Rewards
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                UI Mockup
              </Badge>
            </CardTitle>
            <CardDescription>Track your progress, earn badges, and compete with other farmers</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Stats */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 bg-green-600 text-white text-2xl">
                <AvatarFallback>🌟</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold text-green-900">Level {userLevel}</h3>
                <p className="text-sm text-green-700">{userPoints.toLocaleString()} points</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 mb-2">
                <Crown className="h-3 w-3 mr-1" />
                Rank #5
              </Badge>
              <p className="text-xs text-green-700">Top 10%</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700">Progress to Level {userLevel + 1}</span>
              <span className="font-semibold text-green-900">
                {userPoints} / {pointsToNextLevel}
              </span>
            </div>
            <Progress value={levelProgress} className="h-3" />
            <p className="text-xs text-green-600 text-center">
              {pointsToNextLevel - userPoints} points to next level
            </p>
          </div>
        </div>

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Your Achievements</h4>
              <Badge variant="outline">
                {unlockedAchievements} / {MOCK_ACHIEVEMENTS.length} Unlocked
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_ACHIEVEMENTS.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-4 ${
                    achievement.unlocked
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`text-4xl ${achievement.unlocked ? "" : "grayscale opacity-50"}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <h5 className="font-semibold">{achievement.title}</h5>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                    {achievement.unlocked && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <Star className="h-3 w-3 mr-1" />
                        +{achievement.points}
                      </Badge>
                    )}
                  </div>

                  {!achievement.unlocked && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">
                          {achievement.progress} / {achievement.total}
                        </span>
                      </div>
                      <Progress value={(achievement.progress / achievement.total) * 100} className="h-2" />
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="bg-green-100 border border-green-200 rounded p-2 text-center">
                      <p className="text-xs font-semibold text-green-700">✓ UNLOCKED</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Regional Leaderboard</h4>
              <Badge variant="outline">Kiambu County</Badge>
            </div>

            <div className="space-y-2">
              {MOCK_LEADERBOARD.map((entry) => (
                <div
                  key={entry.rank}
                  className={`border rounded-lg p-4 flex items-center justify-between ${
                    entry.isCurrentUser
                      ? "bg-green-50 border-green-300 shadow-sm"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${
                      entry.rank === 1 ? "text-yellow-600" :
                      entry.rank === 2 ? "text-gray-400" :
                      entry.rank === 3 ? "text-orange-600" :
                      "text-gray-600"
                    }`}>
                      #{entry.rank}
                    </div>
                    <div className="text-3xl">{entry.badge}</div>
                    <div>
                      <p className={`font-semibold ${entry.isCurrentUser ? "text-green-900" : ""}`}>
                        {entry.name}
                      </p>
                      <p className="text-sm text-muted-foreground">Level {entry.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {entry.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-700">
                💪 Climb the leaderboard by selling at optimal times and helping other farmers!
              </p>
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Available Rewards</h4>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                {totalPoints} points earned
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reward Cards */}
              <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-lg">Premium Market Insights</h5>
                    <p className="text-sm text-muted-foreground">30-day access</p>
                  </div>
                  <Medal className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Get advanced price predictions and exclusive market intelligence
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    2000 points
                  </Badge>
                  <button className="text-sm font-semibold text-green-600 hover:underline">
                    Redeem →
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-lg">Free Transport Voucher</h5>
                    <p className="text-sm text-muted-foreground">Up to 50km</p>
                  </div>
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  One free transport booking to any market within 50km
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    1500 points
                  </Badge>
                  <button className="text-sm font-semibold text-green-600 hover:underline">
                    Redeem →
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-lg">Asha Priority Support</h5>
                    <p className="text-sm text-muted-foreground">7-day access</p>
                  </div>
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Get instant responses from Asha AI with priority queue
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                    1000 points
                  </Badge>
                  <button className="text-sm font-semibold text-green-600 hover:underline">
                    Redeem →
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-lg">Farming Inputs Discount</h5>
                    <p className="text-sm text-muted-foreground">10% off</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  10% discount on seeds, fertilizer, and pesticides
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                    2500 points
                  </Badge>
                  <button className="text-sm font-semibold text-gray-400 cursor-not-allowed">
                    Locked
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h5 className="font-semibold text-amber-900 mb-2">🎁 How to Earn More Points</h5>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Sell at optimal times (+50 points)</li>
                <li>• Complete achievements (+200-600 points)</li>
                <li>• Help other farmers (+25 points)</li>
                <li>• Daily check-ins (+10 points)</li>
                <li>• Share success stories (+100 points)</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
