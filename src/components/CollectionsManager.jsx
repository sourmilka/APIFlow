import { useState, useEffect } from 'react';
import { FolderPlus, Folder, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

function CollectionsManager({ onAddToCollection }) {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState(() => {
    const saved = localStorage.getItem('apiCollections');
    return saved ? JSON.parse(saved) : [];
  });
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    localStorage.setItem('apiCollections', JSON.stringify(collections));
  }, [collections]);

  const createCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const newCollection = {
      id: Date.now().toString(),
      name: newCollectionName.trim(),
      apiCount: 0,
      created: new Date().toISOString(),
    };
    
    setCollections([...collections, newCollection]);
    setNewCollectionName('');
  };

  const deleteCollection = (id) => {
    setCollections(collections.filter(c => c.id !== id));
  };

  const startEdit = (collection) => {
    setEditingId(collection.id);
    setEditingName(collection.name);
  };

  const saveEdit = (id) => {
    if (!editingName.trim()) return;
    setCollections(collections.map(c => 
      c.id === id ? { ...c, name: editingName.trim() } : c
    ));
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 h-9">
          <Folder className="h-4 w-4" />
          Collections
          {collections.length > 0 && (
            <Badge variant="outline" className="ml-1 h-5 px-1.5">
              {collections.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Collection */}
          <div className="flex gap-2">
            <Input
              placeholder="New collection name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createCollection()}
              className="flex-1"
            />
            <Button onClick={createCollection} disabled={!newCollectionName.trim()}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>

          <Separator />

          {/* Collections List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {collections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No collections yet</p>
                <p className="text-xs mt-1">Create one to organize your APIs</p>
              </div>
            ) : (
              collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center gap-2 p-3 border border-border rounded hover:bg-secondary/30 transition-colors"
                >
                  <Folder className="h-4 w-4 text-primary" />
                  
                  {editingId === collection.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(collection.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => saveEdit(collection.id)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelEdit}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{collection.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {collection.apiCount || 0} APIs • {new Date(collection.created).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(collection)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCollection(collection.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onAddToCollection?.(collection.id);
                          setIsOpen(false);
                        }}
                        className="h-8"
                      >
                        Add Selected
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CollectionsManager;
