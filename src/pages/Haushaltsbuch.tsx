/**
 * Haushaltsbuch Seite für MojoBus
 * Sichere, verschlüsselte Ausgabenverwaltung für Mojo & Susanne
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, Filter, Download, Lock } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/useToast';

// Import Expense Types and Utilities
import {
  EXPENSE_KINDS,
  EXPENSE_CATEGORIES,
  AUTHOR_PUBKEYS,
  isAuthorizedUser,
  formatAmount,
  getMonthFromDate,
  getCurrentMonth,
  type ExpenseData,
} from '@/config/expenseTypes';
import { useNostrLogin } from '@nostrify/react/login';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import { ExpenseList } from '@/components/expense/ExpenseList';
import { ExpenseStats } from '@/components/expense/ExpenseStats';

export default function Haushaltsbuch() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useNostrLogin();
  
  // State
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check if user is authorized (Mojo or Susanne)
  const isAuthorized = useMemo(() => {
    if (!user?.pubkey) return false;
    return isAuthorizedUser(user.pubkey);
  }, [user]);
  
  // TODO: Load expense events from Nostr
  // For MVP, using empty array
  const events: any[] = [];
  const isLoading = false;
  
  // Filter events for current month
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      try {
        // Parse the content (encrypted)
        const content = JSON.parse(event.content);
        // Check if this is an encrypted expense event
        if (content.encryptedContent && content.keys) {
          // For now, just count it - decryption happens in child components
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });
  }, [events]);
  
  // Redirect if not authorized
  useEffect(() => {
    if (user && !isAuthorized) {
      toast({
        title: 'Zugriff verweigert',
        description: 'Das Haushaltsbuch ist nur für Mojo und Susanne verfügbar.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, isAuthorized, navigate, toast]);
  
  // Show loading state
  if (!user) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">Bitte einloggen</h2>
          <p className="text-muted-foreground">
            Du musst mit deinem Nostr-Account eingeloggt sein.
          </p>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">Zugriff beschränkt</h2>
          <p className="text-muted-foreground mb-6">
            Das Haushaltsbuch ist nur für Mojo und Susanne verfügbar.
            Dein Public Key ist nicht autorisiert.
          </p>
          <Button onClick={() => navigate('/')}>
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 min-h-screen">
      <Toaster />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Haushaltsbuch</h1>
            <p className="text-muted-foreground mt-2">
              Sichere Ausgabenverwaltung für Mojo & Susanne
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implement filter */}}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Implement export */}}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Neue Ausgabe
            </Button>
          </div>
        </div>
        
        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm">
          <Lock className="h-3 w-3" />
          <span>End-to-end verschlüsselt • Nur für Mojo & Susanne</span>
        </div>
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="expenses">Alle Ausgaben</TabsTrigger>
          <TabsTrigger value="statistics">Statistiken</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Dieser Monat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? '...' : formatAmount(0 /* TODO: Calculate */)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredEvents.length} Ausgaben
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Letzte 30 Tage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? '...' : formatAmount(0 /* TODO: Calculate */)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Durchschnitt pro Tag
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Top Kategorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold flex items-center gap-2">
                  <span>🚐</span>
                  <span>Transport</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {/* TODO: Calculate percentage */}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Neueste Ausgaben</CardTitle>
              <CardDescription>
                Die letzten 10 Ausgaben
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Noch keine Ausgaben erfasst.</p>
                  <Button
                    onClick={() => setShowForm(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Erste Ausgabe erfassen
                  </Button>
                </div>
              ) : (
                <ExpenseList
                  events={filteredEvents.slice(0, 10)}
                  currentUserPubkey={user.pubkey}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* All Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Alle Ausgaben</CardTitle>
              <CardDescription>
                Gesamte Liste aller erfassten Ausgaben
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ExpenseList
                  events={filteredEvents}
                  currentUserPubkey={user.pubkey}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <ExpenseStats
            events={filteredEvents}
            currentUserPubkey={user.pubkey}
          />
        </TabsContent>
      </Tabs>
      
      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ExpenseForm
              currentUserPubkey={user.pubkey}
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                toast({
                  title: 'Ausgabe gespeichert',
                  description: 'Die Ausgabe wurde verschlüsselt gespeichert.',
                });
              }}
            />
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Lade Ausgaben...</p>
          </div>
        </div>
      )}
    </div>
  );
}