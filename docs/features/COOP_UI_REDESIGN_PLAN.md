# Cooperative Organization UI Redesign Plan

## Critical Issues Identified

### 1. **OrgDashboard** - Priority: HIGH
**Problems:**
- Metrics cards lack visual hierarchy and context
- Price signals card is cramped and hard to read
- Analytics section feels disconnected
- No clear call-to-action flow
- Market selector dropdown is buried in card header

**Solutions:**
- Redesign metrics cards with icons, better typography, and trend indicators
- Create dedicated price dashboard with better layout
- Add visual progress indicators for seat usage
- Implement action-oriented dashboard with quick links
- Move market selector to prominent position

### 2. **OrgMembers** - Priority: CRITICAL
**Problems:**
- 6-step wizard is overwhelming and has poor mobile UX
- Too many approval tables (applications, join requests, pending members)
- CSV import is buried and has no preview
- Seat assignment flow is confusing
- Document upload has no visual feedback
- Invite codes table is too wide and breaks on mobile

**Solutions:**
- Reduce wizard to 3 steps with smart defaults
- Consolidate approval workflows into single unified view
- Improve CSV import with drag-drop and better preview
- Simplify seat assignment with visual seat availability
- Add image preview for document uploads
- Make invite codes responsive with mobile-friendly actions

### 3. **OrgProfile** - Priority: MEDIUM
**Problems:**
- Very basic read-only view
- No visual appeal or branding
- Missing key information (member count, activity, etc.)
- No edit functionality
- Lacks cooperative identity elements

**Solutions:**
- Add cooperative branding section with logo/banner
- Include key metrics and activity indicators
- Add edit mode with inline editing
- Show member growth chart
- Add cooperative certifications/badges section

### 4. **OrgAggregation** - Priority: HIGH
**Problems:**
- Form layout is confusing
- No visual feedback for collection plans
- Commitments and deliveries are hard to track
- No progress indicators
- Missing batch management features

**Solutions:**
- Redesign form with step-by-step wizard
- Add visual calendar for collection planning
- Create progress bars for commitments vs deliveries
- Add batch tracking with QR codes
- Implement grade distribution charts

### 5. **OrgMarketDashboard** - Priority: HIGH
**Problems:**
- Empty placeholder with no value
- Should aggregate Market Oracle insights for org

**Solutions:**
- Build comprehensive market dashboard
- Show aggregated price trends for org crops
- Display member crop distribution
- Add market opportunity alerts
- Include price comparison across markets

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. OrgMembers wizard simplification
2. OrgDashboard metrics redesign
3. OrgMarketDashboard implementation

### Phase 2: High Priority (Next)
1. OrgAggregation workflow improvement
2. OrgProfile enhancement
3. Mobile responsiveness fixes

### Phase 3: Polish (Final)
1. Animation and transitions
2. Loading states improvement
3. Error handling enhancement
4. Accessibility improvements

## Design System Enhancements

### Colors
- Primary Green: #005302
- Accent Lime: #8bc60b
- Background: #dce9ff
- Success: #10b981
- Warning: #f59e0b
- Error: #ef4444

### Typography
- Headers: font-semibold, larger sizes
- Body: text-sm for dense data, text-base for reading
- Metrics: text-2xl to text-4xl with font-bold

### Components Needed
- StatCard with icon, trend indicator, and sparkline
- ProgressRing for circular progress
- TimelineView for approval workflows
- BatchCard for collection management
- MemberCard for member profiles
- QuickActionButton for dashboard actions

## Mobile-First Considerations
- Stack cards vertically on mobile
- Use drawers instead of modals on mobile
- Implement swipe gestures for actions
- Add bottom navigation for quick access
- Use collapsible sections to reduce scroll
