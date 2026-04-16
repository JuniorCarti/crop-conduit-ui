import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageSquare, Users, FileText, Bell, Plus, Trash2, Edit, Lock } from "lucide-react";

export default function BuyerCollaborationCommunication() {
  const [showNewTeamMember, setShowNewTeamMember] = useState(false);
  const [showNewDocument, setShowNewDocument] = useState(false);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Collaboration & Communication</h1>
        <p className="text-sm text-muted-foreground">Manage team, share documents, and communicate</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        {/* Team Management */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewTeamMember(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: "John Kipchoge",
                    email: "john@agrismart.com",
                    role: "Procurement Manager",
                    status: "active",
                    permissions: ["view", "edit", "approve"],
                  },
                  {
                    name: "Mary Kiplagat",
                    email: "mary@agrismart.com",
                    role: "Finance Lead",
                    status: "active",
                    permissions: ["view", "approve"],
                  },
                  {
                    name: "Peter Mwangi",
                    email: "peter@agrismart.com",
                    role: "Logistics Coordinator",
                    status: "active",
                    permissions: ["view", "edit"],
                  },
                  {
                    name: "Sarah Omondi",
                    email: "sarah@agrismart.com",
                    role: "Quality Analyst",
                    status: "inactive",
                    permissions: ["view"],
                  },
                ].map((member) => (
                  <div key={member.email} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">{member.role}</Badge>
                          <Badge variant={member.status === "active" ? "default" : "secondary"}>
                            {member.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="mt-2 flex gap-1">
                          {member.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role-Based Access Control */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Role-Based Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    role: "Admin",
                    permissions: ["View all", "Edit all", "Approve", "Manage team", "System settings"],
                  },
                  {
                    role: "Procurement Manager",
                    permissions: ["View all", "Create POs", "Manage suppliers", "Approve orders"],
                  },
                  {
                    role: "Finance Lead",
                    permissions: ["View financials", "Approve payments", "View reports"],
                  },
                  {
                    role: "Viewer",
                    permissions: ["View dashboards", "View reports"],
                  },
                ].map((role) => (
                  <div key={role.role} className="rounded-lg border border-border/60 p-4">
                    <p className="mb-2 font-medium">{role.role}</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((perm) => (
                        <Badge key={perm} variant="secondary">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messaging */}
        <TabsContent value="messaging" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Unified Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    participant: "Cooperative A",
                    lastMessage: "Confirmed delivery for next week",
                    time: "2 hours ago",
                    unread: false,
                    channel: "WhatsApp",
                  },
                  {
                    participant: "John Kipchoge",
                    lastMessage: "PO-2024-001 approved",
                    time: "1 hour ago",
                    unread: true,
                    channel: "In-app",
                  },
                  {
                    participant: "Finance Team",
                    lastMessage: "Invoice INV-2024-002 received",
                    time: "30 min ago",
                    unread: true,
                    channel: "Email",
                  },
                  {
                    participant: "Cooperative B",
                    lastMessage: "Price quote for bulk order",
                    time: "1 day ago",
                    unread: false,
                    channel: "SMS",
                  },
                ].map((msg) => (
                  <div
                    key={msg.participant}
                    className={`rounded-lg border border-border/60 p-4 ${msg.unread ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{msg.participant}</p>
                        <p className="text-sm text-muted-foreground">{msg.lastMessage}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {msg.channel}
                          </Badge>
                          {msg.unread && <Badge className="text-xs">New</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{msg.time}</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: "Order Updates", email: true, sms: true, whatsapp: true },
                  { type: "Price Alerts", email: true, sms: false, whatsapp: true },
                  { type: "Delivery Notifications", email: true, sms: true, whatsapp: true },
                  { type: "Team Messages", email: false, sms: false, whatsapp: true },
                ].map((notif) => (
                  <div key={notif.type} className="rounded-lg border border-border/60 p-3">
                    <p className="mb-2 font-medium">{notif.type}</p>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notif.email} readOnly className="rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notif.sms} readOnly className="rounded" />
                        SMS
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={notif.whatsapp} readOnly className="rounded" />
                        WhatsApp
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewDocument(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Document Repository</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    name: "Supplier Contracts",
                    files: 12,
                    lastUpdated: "Mar 20, 2024",
                    access: "Team",
                  },
                  {
                    name: "PO Templates",
                    files: 5,
                    lastUpdated: "Mar 15, 2024",
                    access: "Public",
                  },
                  {
                    name: "Quality Standards",
                    files: 8,
                    lastUpdated: "Mar 10, 2024",
                    access: "Team",
                  },
                  {
                    name: "Financial Reports",
                    files: 24,
                    lastUpdated: "Mar 21, 2024",
                    access: "Finance Team",
                  },
                ].map((folder) => (
                  <div key={folder.name} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{folder.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {folder.files} files • Updated {folder.lastUpdated}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          {folder.access}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Open
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: "Q1 Financial Report.pdf", size: "2.4 MB", date: "Mar 21, 2024" },
                  { name: "Supplier Agreement - Coop A.docx", size: "1.2 MB", date: "Mar 20, 2024" },
                  { name: "Quality Standards v2.xlsx", size: "850 KB", date: "Mar 19, 2024" },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.size} • {doc.date}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Broadcast Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    title: "System Maintenance Scheduled",
                    message: "Platform will be down for maintenance on Mar 25, 2024 from 2-4 PM",
                    date: "Mar 21, 2024",
                    priority: "high",
                  },
                  {
                    title: "New Quality Standards Released",
                    message: "Updated quality inspection guidelines are now available in the documents section",
                    date: "Mar 20, 2024",
                    priority: "medium",
                  },
                  {
                    title: "Q1 Performance Review",
                    message: "Congratulations! Your team achieved 95% on-time delivery rate",
                    date: "Mar 19, 2024",
                    priority: "low",
                  },
                ].map((announcement) => (
                  <div key={announcement.title} className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{announcement.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{announcement.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{announcement.date}</p>
                      </div>
                      <Badge
                        variant={
                          announcement.priority === "high"
                            ? "destructive"
                            : announcement.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {announcement.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Team Member Dialog */}
      <Dialog open={showNewTeamMember} onOpenChange={setShowNewTeamMember}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input placeholder="member@company.com" />
            </div>
            <div>
              <Label className="mb-2 block">Role</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Procurement Manager</SelectItem>
                  <SelectItem value="finance">Finance Lead</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewTeamMember(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewTeamMember(false)}>Add Member</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={showNewDocument} onOpenChange={setShowNewDocument}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Document Name</Label>
              <Input placeholder="e.g., Q1 Report" />
            </div>
            <div>
              <Label className="mb-2 block">Folder</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contracts">Supplier Contracts</SelectItem>
                  <SelectItem value="templates">PO Templates</SelectItem>
                  <SelectItem value="quality">Quality Standards</SelectItem>
                  <SelectItem value="reports">Financial Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Access Level</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewDocument(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewDocument(false)}>Upload</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
