import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RideConfirmation } from './RideConfirmation';
import { MapPin, Calendar, Clock, User, RefreshCw, Mail, Phone } from 'lucide-react';

interface BrowseRidesProps {
  user: any;
}

export function BrowseRides({ user }: BrowseRidesProps) {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedRide, setSelectedRide] = useState<any>(null);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6f95a428/rides`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        console.error('Fetch rides error response:', data);
        throw new Error(data.error || 'Failed to fetch rides');
      }

      const data = await response.json();
      setRides(data.rides);
    } catch (err: any) {
      console.error('Fetch rides error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (rideId: string) => {
    setClaimingId(rideId);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6f95a428/rides/${rideId}/claim`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim ride');
      }

      // Show confirmation dialog
      setSelectedRide(data.ride);
      
      // Refresh rides list
      await fetchRides();
    } catch (err: any) {
      console.error('Claim ride error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setClaimingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPaymentLabel = (ride: any) => {
    const amount = ride.paymentAmount || 0;
    const type = ride.paymentType || 'meal-swipes';
    
    if (type === 'free') return 'Free Ride';
    if (amount === 0) return null;
    
    if (type === 'meal-swipes') {
      return `${amount} meal swipe${amount > 1 ? 's' : ''}`;
    } else if (type === 'dining-dollars') {
      return `$${amount.toFixed(2)} dining dollars`;
    } else {
      return `$${amount.toFixed(2)} cash`;
    }
  };

  const getPaymentIcon = (ride: any) => {
    const type = ride.paymentType || 'meal-swipes';
    return type === 'free' ? '🎁' : type === 'meal-swipes' ? '🍽️' : type === 'dining-dollars' ? '💳' : '💵';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading rides...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl">Available Rides</h2>
          <p className="text-gray-600">Students looking for rides</p>
        </div>
        <Button variant="outline" onClick={fetchRides}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {rides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No ride requests available at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">Check back later or post your own ride request!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rides.map((ride) => (
            <Card key={ride.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-3">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    {ride.riderName}
                  </CardTitle>
                  {getPaymentLabel(ride) && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <span className="mr-1">{getPaymentIcon(ride)}</span>
                      {getPaymentLabel(ride)}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>From: {ride.pickupLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span>To: {ride.dropoffLocation}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(ride.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(ride.time)}</span>
                  </div>
                </div>

                {/* Contact Information - only visible to other users, not the ride poster */}
                {ride.riderId !== user.id && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm mb-2">📞 Contact Information:</p>
                    <div className="space-y-1 text-sm">
                      {ride.riderCollegeEmail && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <a href={`mailto:${ride.riderCollegeEmail}`} className="hover:underline">
                            {ride.riderCollegeEmail}
                          </a>
                        </div>
                      )}
                      {ride.riderPhone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <a href={`tel:${ride.riderPhone}`} className="hover:underline">
                            {ride.riderPhone}
                          </a>
                        </div>
                      )}
                      {!ride.riderPhone && !ride.riderCollegeEmail && (
                        <p className="text-gray-500 text-xs">No contact info provided</p>
                      )}
                    </div>
                  </div>
                )}

                {ride.riderId !== user.id ? (
                  <Button
                    onClick={() => handleClaim(ride.id)}
                    disabled={claimingId === ride.id}
                    className="w-full"
                  >
                    {claimingId === ride.id ? 'Claiming...' : 'Claim Ride'}
                  </Button>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-center">
                    This is your ride request
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedRide && (
        <RideConfirmation
          ride={selectedRide}
          user={user}
          onClose={() => {
            setSelectedRide(null);
            fetchRides();
          }}
          onComplete={() => {
            setSelectedRide(null);
            fetchRides();
          }}
        />
      )}
    </div>
  );
}