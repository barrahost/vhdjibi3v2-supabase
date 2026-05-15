import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, writeBatch } from '../lib/firebase';
import { StorageService } from '../services/storage.service';
import { Plus, Search, Trash2, Pencil, Play, Pause, Calendar, Loader2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { formatDate, formatDateForInput } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import { CustomTable } from '../components/ui/CustomTable';
import { CategoryForm } from '../components/audio/categories/CategoryForm';
import { CategoryList } from '../components/audio/categories/CategoryList';
import { CustomPagination } from '../components/ui/CustomPagination';
import { Tabs } from '../components/ui/tabs';
import { useCategories } from '../hooks/useCategories';
import { isWithinLast7Days } from '../utils/dateUtils';

// Helper function to get date from one month ago
const getOneMonthAgoDate = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
};

interface Teaching {
  id: string;
  title: string;
  description: string;
  speaker: string;
  category: string;
  tags: string[];
  duration: number;
  fileUrl: string;
  thumbnail_url?: string;
  plays?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'active' | 'inactive' | 'deleted';
  date: Date;
  theme?: string;
}

export default function AudioManagement() {
  const [teachings, setTeachings] = useState<Teaching[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teachings' | 'categories'>('teachings');
  const [showForm, setShowForm] = useState(false);
  const [editingTeaching, setEditingTeaching] = useState<Teaching | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    speaker: '',
    category: '',
    tags: [] as string[],
    date: new Date().toISOString().split('T')[0],
    file: null as File | null,
    thumbnail: null as File | null,
    theme: ''
  });
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories } = useCategories();
  
  // Add filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [selectedTeachings, setSelectedTeachings] = useState<Set<string>>(new Set());
  const [bulkActionCategory, setBulkActionCategory] = useState('');
  const [startDate, setStartDate] = useState(getOneMonthAgoDate());
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [filteredTeachings, setFilteredTeachings] = useState<Teaching[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let q = query(
      collection(db, 'teachings'),
      where('status', '==', 'active'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teachingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        thumbnail_url: doc.data().thumbnailUrl, // Map the old property to the new expected name
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Teaching[];
      
      setTeachings(teachingsData);
      
      // Extract unique speakers from teachings
      const uniqueSpeakers = [...new Set(teachingsData.map(t => t.speaker))];
      setSpeakers(uniqueSpeakers);
      
      setLoading(false);
    }, (error) => {
      console.error('Error loading teachings:', error);
      toast.error('Erreur lors du chargement des enseignements');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter teachings based on filters
  useEffect(() => {
    let filtered = [...teachings];
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(teaching => teaching.category === selectedCategory);
    }
    
    // Apply speaker filter
    if (selectedSpeaker) {
      filtered = filtered.filter(teaching => teaching.speaker === selectedSpeaker);
    }
    
    // Apply date range filter
    if (startDate) {
      const startDateObj = new Date(startDate);
      filtered = filtered.filter(teaching => teaching.date >= startDateObj);
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      // Set to end of day
      endDateObj.setHours(23, 59, 59, 999);
      filtered = filtered.filter(teaching => teaching.date <= endDateObj);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(teaching => 
        teaching.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teaching.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teaching.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teaching.theme?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTeachings(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [teachings, searchTerm, selectedCategory, selectedSpeaker, startDate, endDate]);

  // Calculate paginated data
  const totalPages = Math.ceil(filteredTeachings.length / itemsPerPage);
  const paginatedTeachings = filteredTeachings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const MAX_FILE_SIZE = 104857600; // 100MB (matches Supabase limit)
    
    try {
      if (editingTeaching) {
        // Update existing teaching
        const updates: any = {
          date: new Date(formData.date),
          updatedAt: new Date()
        };

        // Only include fields that have changed
        if (formData.title !== editingTeaching.title) {
          updates.title = formData.title.trim();
        }
        if (formData.description !== editingTeaching.description) {
          updates.description = formData.description.trim();
        }
        if (formData.speaker !== editingTeaching.speaker) {
          updates.speaker = formData.speaker.trim();
        }
        if (formData.theme !== editingTeaching.theme) {
          updates.theme = formData.theme.trim();
        }
        if (formData.category !== editingTeaching.category) {
          updates.category = formData.category;
        }

        // Handle file upload if new file provided
        if (formData.file) {
          const fileUrl = await StorageService.uploadAudioFile(formData.file);
          
          // Get duration of new audio file
          const audio = new Audio();
          const getDuration = new Promise((resolve, reject) => {
            audio.addEventListener('loadedmetadata', () => {
              const duration = Math.round(audio.duration);
              console.log('New audio duration:', duration, 'seconds');
              resolve(duration);
            });
            audio.addEventListener('error', (e) => {
              console.error('Error loading audio:', e);
              reject(new Error('Erreur lors du chargement de l\'audio'));
            });
          });
          
          audio.src = fileUrl;
          const duration = await getDuration;
          
          updates.fileUrl = fileUrl;
          updates.duration = duration;
        }

        // Handle thumbnail upload if new thumbnail provided
        if (formData.thumbnail) {
          const thumbnail_url = await StorageService.uploadAudioFile(formData.thumbnail);
          updates.thumbnailUrl = thumbnail_url; // Keep the original property name for database storage
          updates.thumbnail_url = thumbnail_url; // Add the new property name for component display
        }

        await updateDoc(doc(db, 'teachings', editingTeaching.id), updates);
        toast.success('Enseignement modifié avec succès');
        setShowForm(false);
        return;
      }
      
      // For new entries, validate required fields
      if (!formData.file) {
        toast.error('Le fichier audio est requis');
        setIsSubmitting(false);
        return;
      }

      // Check file size before attempting upload
      if (formData.file.size > MAX_FILE_SIZE) {
        const fileSizeMB = Math.round(formData.file.size / (1024 * 1024));
        toast.error(`Le fichier fait ${fileSizeMB}MB et ne doit pas dépasser 100MB`);
        setIsSubmitting(false);
        return;
      }

      // Validate file type
      const validTypes = [
        'audio/mpeg',        // MP3
        'audio/wav',         // WAV
        'audio/mp4',         // M4A
        'audio/x-m4a',       // M4A (alternative MIME type)
        'audio/x-wav',       // WAV (alternative MIME type)
        'audio/mp3'          // MP3 (alternative MIME type)
      ];
      
      const fileType = formData.file.type.toLowerCase();
      const fileExtension = formData.file.name.split('.').pop()?.toLowerCase();
      
      const isValidType = validTypes.includes(fileType) || 
        (fileExtension && ['mp3', 'wav', 'm4a'].includes(fileExtension));
      
      if (!isValidType) {
        toast.error('Le fichier doit être au format audio (MP3, WAV, M4A)');
        setIsSubmitting(false);
        return;
      }

      // Validate that the audio file can be decoded
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await formData.file.arrayBuffer();
        await audioContext.decodeAudioData(arrayBuffer);
        audioContext.close(); // Clean up the audio context
      } catch (decodeError) {
        console.error('Audio decode error:', decodeError);
        toast.error('Le fichier audio est corrompu ou dans un format non supporté');
        setIsSubmitting(false);
        return;
      }

      if (!formData.title.trim()) {
        toast.error('Le titre est requis');
        setIsSubmitting(false);
        return;
      }

      if (!formData.speaker.trim()) {
        toast.error('L\'orateur est requis');
        setIsSubmitting(false);
        return;
      }

      if (!formData.category) {
        toast.error('La catégorie est requise');
        setIsSubmitting(false);
        return;
      }

      const fileUrl = await StorageService.uploadAudioFile(formData.file);
      let thumbnailUrl;
      
      // Load audio file to get duration
      const audio = new Audio();
      let duration = 0;
      
      // Create a Promise to handle audio metadata loading
      const getDuration = new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          duration = Math.round(audio.duration);
          console.log('Audio duration:', duration, 'seconds');
          resolve(duration);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Error loading audio:', e);
          reject(new Error('Erreur lors du chargement de l\'audio'));
        });
      });
      
      // Set audio source and wait for duration
      audio.src = fileUrl;
      await getDuration;
      
      if (formData.thumbnail) {
        const uploadedThumbnailUrl = await StorageService.uploadAudioFile(formData.thumbnail);
        thumbnailUrl = uploadedThumbnailUrl;
      }
      
      // Save to Firestore with correct duration
      await addDoc(collection(db, 'teachings'), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        speaker: formData.speaker.trim(),
        theme: formData.theme.trim(),
        date: new Date(formData.date),
        category: formData.category,
        tags: formData.tags,
        duration,
        fileUrl,
        thumbnailUrl: thumbnailUrl || null,
        thumbnail_url: thumbnailUrl || null, // Add both property names
        plays: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        status: 'active'
      });
      
      toast.success('Enseignement ajouté avec succès');
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        speaker: '',
        category: '',
        tags: [],
        date: new Date().toISOString().split('T')[0],
        file: null,
        thumbnail: null,
        theme: ''
      });
    } catch (error: any) {
      console.error('Error adding teaching:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout de l\'enseignement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (teaching: Teaching) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignement ?')) {
      return;
    }

    try {
      // Delete from storage
      await StorageService.deleteAudioFile(teaching.fileUrl);

      // If there's a thumbnail, delete it too
      if (teaching.thumbnail_url) {
        await StorageService.deleteAudioFile(teaching.thumbnail_url);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, 'teachings', teaching.id));

      toast.success('Enseignement supprimé avec succès');
    } catch (error) {
      console.error('Error deleting teaching:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handlePlayPreview = (fileUrl: string) => {
    if (playingAudio === fileUrl) {
      // Stop playing
      audioElement?.pause();
      setPlayingAudio(null);
      setAudioElement(null);
    } else {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
      }
      
      // Start playing new audio
      const audio = new Audio(fileUrl);
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
        setAudioElement(null);
      });
      audio.play();
      setPlayingAudio(fileUrl);
      setAudioElement(audio);
    }
  };

  const handleEdit = (teaching: Teaching) => {
    setEditingTeaching(teaching);
    setFormData({
      title: teaching.title || '',
      description: teaching.description || '',
      date: formatDateForInput(teaching.date) || new Date().toISOString().split('T')[0],
      speaker: teaching.speaker || '',
      category: teaching.category || '',
      tags: teaching.tags || [],
      file: null,
      thumbnail: null,
      theme: teaching.theme || ''
    });
    setShowForm(true);
  };

  // Bulk category update
  const handleBulkCategoryUpdate = async () => {
    if (!bulkActionCategory || selectedTeachings.size === 0) {
      toast.error('Veuillez sélectionner une catégorie et au moins un audio');
      return;
    }

    try {
      const batch = writeBatch(db);
      let count = 0;

      // Show loading toast
      const loadingToast = toast.loading(`Mise à jour de ${selectedTeachings.size} audios...`);

      // Update each selected teaching in the batch
      selectedTeachings.forEach(id => {
        const teachingRef = doc(db, 'teachings', id);
        batch.update(teachingRef, { 
          category: bulkActionCategory,
          updatedAt: new Date()
        });
        count++;
      });

      // Commit the batch
      await batch.commit();

      // Dismiss loading toast and show success toast
      toast.dismiss(loadingToast);
      toast.success(`${count} audio(s) mis à jour avec succès`);

      // Clear selections
      setSelectedTeachings(new Set());
      setBulkActionCategory('');
    } catch (error) {
      console.error('Error updating categories:', error);
      toast.error('Erreur lors de la mise à jour des catégories');
    }
  };

  // Toggle selection of a single teaching
  const toggleTeachingSelection = (id: string) => {
    const newSelection = new Set(selectedTeachings);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTeachings(newSelection);
  };

  // Toggle selection of all visible teachings
  const toggleAllTeachings = () => {
    if (selectedTeachings.size === paginatedTeachings.length) {
      // If all are selected, deselect all
      setSelectedTeachings(new Set());
    } else {
      // Otherwise, select all
      const newSelection = new Set<string>();
      paginatedTeachings.forEach(teaching => {
        newSelection.add(teaching.id);
      });
      setSelectedTeachings(newSelection);
    }
  };

  const columns = [
    {
      key: 'selection',
      title: (
        <input
          type="checkbox"
          checked={paginatedTeachings.length > 0 && 
                  selectedTeachings.size === paginatedTeachings.length}
          onChange={toggleAllTeachings}
          className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
        />
      ),
      render: (_: any, teaching: Teaching) => (
        <input
          type="checkbox"
          checked={selectedTeachings.has(teaching.id)}
          onChange={() => toggleTeachingSelection(teaching.id)}
          className="rounded border-gray-300 text-[#00665C] focus:ring-[#00665C]"
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      key: 'thumbnail',
      title: 'Miniature',
      render: (_: any, teaching: Teaching) => (
        <div className="w-16 h-16 rounded overflow-hidden bg-gray-100">
          {teaching.thumbnail_url ? (
            <img 
              src={teaching.thumbnail_url} 
              alt={teaching.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
      )
    },
    {
      key: 'title',
      title: 'Titre',
      render: (value: string, teaching: Teaching) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {value}
          </div>
          {teaching.description && (
            <p className="text-sm text-gray-500 mt-1 max-w-md truncate">
              {teaching.description}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'speaker',
      title: 'Orateur',
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {value || '-'}
        </span>
      )
    },
    {
      key: 'category',
      title: 'Catégorie',
      render: (value: string, teaching: Teaching) => (
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
            {value || 'Non catégorisé'}
          </span>
          {isWithinLast7Days(teaching.date) && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
              À la une
            </span>
          )}
        </div>
      )
    },
    {
      key: 'date',
      title: 'Date',
      render: (value: Date) => (
        <div className="text-sm text-gray-500">
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, teaching: Teaching) => (
        <div className="flex justify-end space-x-2">
          <button
            title="Modifier"
            onClick={() => handleEdit(teaching)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            title={playingAudio === teaching.fileUrl ? "Arrêter" : "Écouter"}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPreview(teaching.fileUrl);
            }}
            className="text-[#00665C] hover:text-[#00665C]/80"
          >
            {playingAudio === teaching.fileUrl ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          <button
            title="Supprimer"
            onClick={() => handleDelete(teaching)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement des enseignements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Audios de cultes</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('teachings')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'teachings'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Audios
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'categories'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Catégories
          </button>
          {activeTab === 'teachings' && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {activeTab === 'categories' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter une catégorie</h2>
            <CategoryForm />
          </div>
          <CategoryList />
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-[#00665C] mb-4">Filtres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orateur
                </label>
                <select
                  value={selectedSpeaker}
                  onChange={(e) => setSelectedSpeaker(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                >
                  <option value="">Tous les orateurs</option>
                  {speakers.map(speaker => (
                    <option key={speaker} value={speaker}>
                      {speaker}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un enseignement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedCategory('');
                  setSelectedSpeaker('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Bulk Action Bar - shown only when items are selected */}
          {selectedTeachings.size > 0 && (
            <div className="mt-4 p-4 bg-[#00665C]/10 rounded-lg border border-[#00665C]/20 flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium text-[#00665C]">
                  {selectedTeachings.size} audio{selectedTeachings.size > 1 ? 's' : ''} sélectionné{selectedTeachings.size > 1 ? 's' : ''}
                </span>
                <div className="ml-4 flex items-center space-x-2">
                  <select
                    value={bulkActionCategory}
                    onChange={(e) => setBulkActionCategory(e.target.value)}
                    className="px-3 py-2 border border-[#00665C]/30 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
                  >
                    <option value="">Changer la catégorie...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkCategoryUpdate}
                    disabled={!bulkActionCategory}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeachings(new Set())}
                className="text-[#00665C] hover:text-[#00665C]/70"
              >
                Annuler
              </button>
            </div>
          )}

          <CustomTable
            data={paginatedTeachings}
            columns={columns}
          />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredTeachings.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setEditingTeaching(null);
          setShowForm(false);
          setFormData({
            title: '',
            description: '',
            speaker: '',
            category: '',
            tags: [],
            date: new Date().toISOString().split('T')[0],
            file: null,
            thumbnail: null,
            theme: ''
          });
        }}
        title={editingTeaching ? "Modifier l'audio" : "Ajouter un audio"}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orateur
            </label>
            <input
              type="text"
              required
              value={formData.speaker}
              onChange={(e) => setFormData(prev => ({ ...prev, speaker: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thème
            </label>
            <input
              type="text"
              value={formData.theme}
              onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              placeholder="ex: La foi qui déplace les montagnes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de l'enseignement
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fichier audio
              {!editingTeaching && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData(prev => ({ ...prev, file }));
                }
              }}
              className="w-full"
              required={!editingTeaching}
            />
            <p className="mt-1 text-sm text-gray-500">
              Formats acceptés : MP3, WAV, M4A (max 200MB)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miniature
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error('La miniature ne doit pas dépasser 2MB');
                    return;
                  }
                  setFormData(prev => ({ ...prev, thumbnail: file }));
                }
              }}
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Format recommandé : 16:9, max 2MB
            </p>
          </div>

          <div className="text-sm text-gray-500 mt-6 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-700 mb-1">Astuce :</p>
            <p>Les audios publiés il y a moins de 7 jours sont automatiquement mis à la une.</p>
            <p className="mt-1">
            Pour modifier la catégorie de plusieurs audios à la fois, fermez ce formulaire, 
            sélectionnez les audios en cochant les cases, puis utilisez l'option de modification par lot qui apparaîtra.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTeaching(null);
                setFormData({
                  title: '',
                  description: '',
                  speaker: '',
                  category: '',
                  tags: [],
                  date: new Date().toISOString().split('T')[0],
                  file: null,
                  thumbnail: null,
                  theme: ''
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'audio'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}