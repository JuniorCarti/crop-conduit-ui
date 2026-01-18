/**
 * Workers Tab Component
 * Displays list of farm workers with status and assignment info
 */

import { Worker } from "@/types/harvest";
import { Users, Trash2, Phone, Mail, Badge, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WorkersTabProps {
    workers: Worker[];
    onDelete: (workerId: string) => Promise<void>;
    onEdit?: (worker: Worker) => void;
}

export default function WorkersTab({ workers, onDelete, onEdit }: WorkersTabProps) {
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await onDelete(deleteTarget);
            setDeleteTarget(null);
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const getRoleBg = (role: Worker["role"]) => {
        switch (role) {
            case "Supervisor":
                return "bg-purple/10 text-purple";
            case "Harvester":
                return "bg-blue/10 text-blue";
            case "Transporter":
                return "bg-orange/10 text-orange";
            case "Quality Inspector":
                return "bg-green/10 text-green";
            default:
                return "bg-gray/10 text-gray";
        }
    };

    return (
        <>
            <div className="grid gap-3">
                {workers.map((worker) => (
                    <div
                        key={worker.id}
                        className="bg-card rounded-lg border border-border/50 p-4 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarFallback className="text-xs font-semibold">
                                        {worker.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-sm">{worker.name}</h4>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleBg(worker.role)}`}>
                                            {worker.role}
                                        </span>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${worker.status === "Active" ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`}>
                                            {worker.status}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        {worker.phone && (
                                            <p className="inline-flex items-center gap-2">
                                                <Phone className="h-3 w-3" />
                                                {worker.phone}
                                            </p>
                                        )}
                                        {worker.email && (
                                            <p className="inline-flex items-center gap-2">
                                                <Mail className="h-3 w-3" />
                                                {worker.email}
                                            </p>
                                        )}
                                        {worker.experience && (
                                            <p className="inline-flex items-center gap-2">
                                                <Badge className="h-3 w-3" />
                                                {worker.experience}
                                            </p>
                                        )}
                                    </div>

                                    {worker.assignedScheduleIds.length > 0 && (
                                        <p className="text-xs mt-2 text-muted-foreground">
                                            <span className="font-medium">{worker.assignedScheduleIds.length}</span> schedule(s) assigned
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {typeof onEdit === "function" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(worker)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <span className="sr-only">Edit worker</span>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget(worker.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Worker</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will remove the worker from your farm. Any assignments will also be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
