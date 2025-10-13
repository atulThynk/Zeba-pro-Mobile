import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import HomeHeader from '@/components/HomeHeader';
import DotAnimation from '@/components/DotAnimation';
import { useIonRouter } from '@ionic/react';


// Define the notification type based on API response
interface Notification {
  imageURL: string | undefined;
  id: number;
  fromUserId: number;
  actorName: string;
  notificationAction: number;
  notificationMessage: string;
  dateCreated: string;
  read: boolean;
  entityId: number;
  entityType: number;
  entityDate: string;
  imageBytes?: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_BASE_URL;
  const router = useIonRouter();

  const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.split(" ");
  const initials = parts.map((p) => p[0]).join("");
  return initials.substring(0, 2).toUpperCase();
};


  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const response = await fetch(`${apiUrl}/notifications?pageNo=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load notifications');
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNotificationClick = (notification: Notification) => {
  switch (notification.entityType) {
    case 1: 
     router.push(`/timeoff`, 'forward');
      break;
    case 2: 
     router.push(`/attendance`, 'forward');
      break;
    // case 3:
    //   router.push(`/tasks/${notification.entityId}`, 'forward');
    //   break;
    // case 4: 
    //    router.push(`/announcements/${notification.entityId}`, 'forward');
      break;
    default:
      console.log('Unknown notification type:', notification.entityType);
      break;
  }
};

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding-bottom">
        <div className="flex-1 bg-white">
          
          <main className="max-w-5xl mx-auto pb-20 px-1 sm:px-6 lg:px-8">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-medium text-gray-800">Notifications</h2>
          </div>
            <div className="bg-white">
              <div>
                {loading && (
                  <div className="p-6 text-center text-gray-500">
                   <DotAnimation/>
                    <p className="mt-2">Loading notifications...</p>
                  </div>
                )}
                
                {error && (
                  <div className="p-6 text-center">
                    <p className="text-gray-600">{error}</p>
                    <button 
                      className="mt-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </button>
                  </div>
                )}
                
                {!loading && !error && notifications.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <p>No notifications available</p>
                  </div>
                )}
                
                {!loading && !error && notifications.length > 0 && (
                  <ul className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <li 
                        key={notification.id} 
                        className={`px-6 py-4 flex items-start ${notification.read ? '' : 'bg-gray-50'}`}
                         onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex-shrink-0 mr-4">
                         {notification.imageURL ? (
  <img
    src={notification.imageURL}
    alt={notification.actorName}
    className="h-10 w-10 rounded-full"
  />
) : (
  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
    {getInitials(notification.actorName)}
  </div>
)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">{notification.actorName}</p>
                            <p className="text-xs text-gray-400">{formatDate(notification.dateCreated)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{notification.notificationMessage}</p>
                        </div>
                        
                        {!notification.read && (
                          <div className="ml-3 flex-shrink-0">
                            <span className="inline-block h-2 w-2 rounded-full bg-gray-700"></span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;