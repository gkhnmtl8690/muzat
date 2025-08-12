import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Play, Pause, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type MusicFile, type FavoriteMusic } from "@shared/schema";

export default function MusicUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [musicName, setMusicName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch uploaded music files
  const { data: uploadedFiles = [] } = useQuery<MusicFile[]>({
    queryKey: ["/api/music-files", { type: "music" }],
    queryFn: () => fetch("/api/music-files?type=music").then(res => res.json()),
  });

  // Fetch favorite musics
  const { data: favoriteMusics = [] } = useQuery<FavoriteMusic[]>({
    queryKey: ["/api/favorite-musics"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/music-files", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/music-files"] });
      setSelectedFile(null);
      setMusicName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({
        title: "Başarılı",
        description: "Müzik dosyası yüklendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Dosya yüklenemedi",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/music-files/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/music-files"] });
      toast({
        title: "Başarılı",
        description: "Müzik dosyası silindi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Dosya silinemedi",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'video/mp4'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setMusicName(file.name.replace(/\.[^/.]+$/, ""));
        
        // Auto-play the selected file
        const fileUrl = URL.createObjectURL(file);
        if (file.type.startsWith('video/')) {
          if (videoRef.current) {
            videoRef.current.src = fileUrl;
            videoRef.current.play();
            setPlayingVideo('selected-file');
          }
          if (audioRef.current) {
            audioRef.current.pause();
            setPlayingAudio(null);
          }
        } else {
          if (audioRef.current) {
            audioRef.current.src = fileUrl;
            audioRef.current.play();
            setPlayingAudio('selected-file');
          }
          if (videoRef.current) {
            videoRef.current.pause();
            setPlayingVideo(null);
          }
        }
      } else {
        toast({
          title: "Hata",
          description: "Sadece MP3 ve MP4 dosyaları kabul edilir",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !musicName.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen dosya seçin ve isim girin",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", musicName.trim());
    formData.append("type", "music");

    uploadMutation.mutate(formData);
  };

  const handlePlay = (audioUrl: string, id: string) => {
    if (playingAudio === id) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(id);
      }
    }
  };

  const handlePlayFavorite = (filename: string, id: string) => {
    // Check if it's a video file
    if (filename.endsWith('.mp4')) {
      const videoUrl = `/videos/music/${filename}`;
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.play();
        setPlayingVideo(id);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingAudio(null);
      }
    } else {
      toast({
        title: "Bilgi",
        description: `${filename} çalmak için gerçek dosya gerekiyor`,
      });
    }
  };

  const handlePlayVideo = (videoUrl: string, id: string) => {
    if (playingVideo === id) {
      videoRef.current?.pause();
      setPlayingVideo(null);
    } else {
      if (videoRef.current) {
        videoRef.current.src = videoUrl;
        videoRef.current.play();
        setPlayingVideo(id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ana Sayfa
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-purple-600">
            Müzikler
          </h1>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Player Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Müzik/Video Oynatıcı
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosya Seç (MP3/MP4)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.mp4,audio/mpeg,audio/mp4,video/mp4"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              {/* Media Player */}
              <div className="bg-gray-100 rounded-lg p-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg"
                  controls
                  onEnded={() => setPlayingVideo(null)}
                  onError={() => setPlayingVideo(null)}
                >
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
                <audio
                  ref={audioRef}
                  className="w-full mt-2"
                  controls
                  onEnded={() => setPlayingAudio(null)}
                  onError={() => setPlayingAudio(null)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müzik Adı
                </label>
                <Input
                  value={musicName}
                  onChange={(e) => setMusicName(e.target.value)}
                  placeholder="Müzik adını girin"
                  className="w-full"
                />
              </div>

              
            </div>
          </div>

          {/* Türk Halk Müziği */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Türk Halk Müziği
            </h2>
            
            <div className="space-y-2">
              {favoriteMusics.map((music) => (
                <button
                  key={music.id}
                  onClick={() => handlePlayFavorite(music.filename || "", music.id)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-gray-800">{music.title}</h3>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Yüklenen Müzikler
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">{file.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{file.originalName}</p>
                    <div className="flex justify-between items-center">
                      <Button
                        onClick={() => handlePlay(`/uploads/${file.filename}`, file.id)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {playingAudio === file.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={() => deleteMutation.mutate(file.id)}
                        size="sm"
                        variant="destructive"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}