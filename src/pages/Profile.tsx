import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditProfileForm } from '@/components/EditProfileForm';
import { useCurrentUser, useAuthor } from '@/hooks/useCurrentUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Edit,
  FileText,
  MessageSquare,
  MapPin,
  ExternalLink,
  Mail,
  Globe,
  Zap
} from 'lucide-react';
import { genUserName } from '@/lib/genUserName';

export default function Profile() {
  const { user } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Bitte logge dich ein, um dein Profil zu sehen.</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Profil bearbeiten</h1>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Abbrechen
          </Button>
        </div>
        <EditProfileForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.metadata?.picture} alt="Profile" />
                <AvatarFallback className="text-2xl">
                  {user.metadata?.name?.charAt(0) || genUserName(user.pubkey).charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold">
                      {user.metadata?.name || genUserName(user.pubkey)}
                    </h1>
                    {user.metadata?.display_name && user.metadata.display_name !== user.metadata.name && (
                      <p className="text-muted-foreground">{user.metadata.display_name}</p>
                    )}
                  </div>
                  <Button onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                    <Edit className="h-4 w-4 mr-2" />
                    Profil bearbeiten
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {user.metadata?.nip05 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.metadata.nip05}
                    </Badge>
                  )}
                  {user.metadata?.bot && (
                    <Badge variant="outline">Bot</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          {user.metadata?.about && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {user.metadata.about}
                </p>
              </CardContent>
            </>
          )}

          {(user.metadata?.website || user.metadata?.banner) && (
            <>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4">
                  {user.metadata?.website && (
                    <a
                      href={user.metadata.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-ocean-600 hover:text-ocean-700 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      {user.metadata.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {user.metadata?.lud16 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      {user.metadata.lud16}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Profile Content Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">Statistiken</TabsTrigger>
            <TabsTrigger value="info">Informationen</TabsTrigger>
            <TabsTrigger value="edit">Profil bearbeiten</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-ocean-600" />
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-muted-foreground">Artikel</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-ocean-600" />
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-muted-foreground">Notes</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-ocean-600" />
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-muted-foreground">Plätze</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Public Key (npub)</p>
                    <p className="text-sm font-mono break-all">{user.npub}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Public Key (hex)</p>
                    <p className="text-sm font-mono break-all">{user.pubkey}</p>
                  </div>
                </div>

                {user.metadata?.banner && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Banner Image</p>
                    <img
                      src={user.metadata.banner}
                      alt="Profile Banner"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil bearbeiten</CardTitle>
                <p className="text-muted-foreground">
                  Aktualisiere deine Profilinformationen
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="mb-4">Für die Bearbeitung deines Profils verwenden wir das vollständige Bearbeitungsformular.</p>
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Vollständiges Bearbeitungsformular öffnen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}