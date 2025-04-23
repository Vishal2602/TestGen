import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllSessions, saveSession, deleteSession } from '@/lib/grokApi';
import { Session, UploadedFile, ExtractedFunction, GeneratedTest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Save, Trash2, Clock, FileText, Code, CheckCircle } from 'lucide-react';

interface SessionManagerProps {
  files: UploadedFile[];
  extractedFunctions?: ExtractedFunction[];
  generatedTests?: GeneratedTest[];
  onLoadSession: (session: Session) => void;
}

export function SessionManager({ 
  files, 
  extractedFunctions, 
  generatedTests, 
  onLoadSession 
}: SessionManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const queryClient = useQueryClient();

  // Get all sessions query
  const { 
    data: sessions, 
    isLoading: isLoadingSessions,
    error: sessionsError
  } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: getAllSessions
  });

  // Save session mutation
  const saveSessionMutation = useMutation({
    mutationFn: (sessionData: {
      name: string;
      description?: string;
      files: UploadedFile[];
      extractedFunctions?: ExtractedFunction[];
      generatedTests?: GeneratedTest[];
    }) => saveSession(
      sessionData.name,
      sessionData.description,
      sessionData.files,
      sessionData.extractedFunctions,
      sessionData.generatedTests,
      {
        totalFiles: sessionData.files.length,
        totalFunctions: sessionData.extractedFunctions?.length || 0,
        totalTests: sessionData.generatedTests?.length || 0,
        averageCoverage: calculateAverageCoverage(sessionData.generatedTests)
      }
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: "Session saved",
        description: `Session "${sessionName}" was successfully saved`,
      });
      setIsCreateOpen(false);
      setSessionName('');
      setSessionDescription('');
    },
    onError: (error) => {
      toast({
        title: "Error saving session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: "Session deleted",
        description: "Session was successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle save session
  const handleSaveSession = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session name required",
        description: "Please provide a name for the session",
        variant: "destructive"
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "No files to save",
        description: "Please upload at least one file before saving a session",
        variant: "destructive"
      });
      return;
    }

    saveSessionMutation.mutate({
      name: sessionName,
      description: sessionDescription || undefined,
      files,
      extractedFunctions,
      generatedTests
    });
  };

  // Calculate average coverage
  const calculateAverageCoverage = (tests?: GeneratedTest[]): number | undefined => {
    if (!tests || tests.length === 0) return undefined;
    
    const testsWithCoverage = tests.filter(test => test.coverage);
    if (testsWithCoverage.length === 0) return undefined;
    
    const sum = testsWithCoverage.reduce((acc, test) => {
      if (!test.coverage) return acc;
      return acc + (
        test.coverage.statementCoverage + 
        test.coverage.branchCoverage + 
        test.coverage.pathCoverage
      ) / 3;
    }, 0);
    
    return sum / testsWithCoverage.length;
  };

  // Format date
  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Session Management</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={files.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Session</DialogTitle>
              <DialogDescription>
                Save your current work to continue later or share with others.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="session-name" className="text-right">
                  Name
                </label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="col-span-3"
                  placeholder="My Project Tests"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="session-description" className="text-right">
                  Description
                </label>
                <Textarea
                  id="session-description"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Optional description for this testing session"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleSaveSession}
                disabled={!sessionName.trim() || saveSessionMutation.isPending}
              >
                {saveSessionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        {isLoadingSessions ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessionsError ? (
          <div className="p-8 text-center text-destructive">
            Error loading sessions
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No saved sessions found
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableCaption>Your saved testing sessions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-center">Files</TableHead>
                  <TableHead className="text-center">Functions</TableHead>
                  <TableHead className="text-center">Tests</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px] truncate" title={session.name}>
                        {session.name}
                      </div>
                      {session.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={session.description}>
                          {session.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm">{formatDate(session.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center">
                        <FileText className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{session.stats?.totalFiles || session.files.length}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center">
                        <Code className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{session.stats?.totalFunctions || (session.extractedFunctions?.length || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center">
                        <CheckCircle className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span>{session.stats?.totalTests || (session.generatedTests?.length || 0)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm" 
                          variant="secondary" 
                          onClick={() => onLoadSession(session)}
                        >
                          Load
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              disabled={deleteSessionMutation.isPending}
                            >
                              {deleteSessionMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this session? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSessionMutation.mutate(session.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}