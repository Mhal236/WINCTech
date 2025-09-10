import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Calendar, Briefcase } from 'lucide-react';

interface VideoDemo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  icon: React.ReactNode;
  duration: string;
}

export const DemoVideos: React.FC = () => {

  const demoVideos: VideoDemo[] = [
    {
      id: 'jobs-tutorial',
      title: 'How to Use the Jobs Tab',
      description: 'Learn how to view, filter, and accept jobs using our swipe interface for exclusive jobs and grid view for regular jobs.',
      thumbnail: '/placeholder.svg',
      icon: <Briefcase className="w-5 h-5 text-blue-600" />,
      duration: 'Coming Soon'
    },
    {
      id: 'calendar-tutorial',
      title: 'Managing Your Calendar',
      description: 'Discover how to view your scheduled jobs, manage appointments, and sync with Google Calendar.',
      thumbnail: '/placeholder.svg',
      icon: <Calendar className="w-5 h-5 text-green-600" />,
      duration: 'Coming Soon'
    }
  ];

  return (
    <>
      <section className="mb-6 sm:mb-8">
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Quick Start Tutorials
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Watch these short videos to get up to speed with the platform
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {demoVideos.map((video) => (
            <Card 
              key={video.id} 
              className="hover:shadow-lg transition-all duration-300 border-gray-200"
            >
              <CardContent className="p-4">
                {/* Video Thumbnail */}
                <div className="relative mb-3 rounded-lg overflow-hidden bg-gray-100 aspect-video">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Coming Soon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-full p-3 shadow-lg">
                      <Play className="w-6 h-6 text-gray-400 ml-1" />
                    </div>
                  </div>
                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {video.icon}
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {video.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                    {video.description}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3 text-xs sm:text-sm"
                    disabled
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
};
