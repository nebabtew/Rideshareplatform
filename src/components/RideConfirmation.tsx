import { useState } from 'react';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Rating } from './Rating';
import { MapPin, Calendar, Clock, User, Phone, Mail, CheckCircle, Star } from 'lucide-react';

interface RideConfirmationProps {
  ride: any;
  user: any;
  onClose: () => void;
  onComplete?: () => void;
}

export function RideConfirmation({ ride, user, onClose, onComplete }: RideConfirmationProps) {
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  const isDriver = ride.driverId === user.id;
  const isRider = ride.riderId === user.id;
  const otherPerson = isDriver ? {
    name: ride.riderName,
    phone: ride.riderPhone,
    email: ride.riderCollegeEmail,
    role: 'Passenger'
  } : {
    name: ride.driverName,
    phone: ride.driverPhone,
    email: ride.driverCollegeEmail,
    role: 'Driver'
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPaymentLabel = () => {
    const amount = ride.paymentAmount || 0;
    if (amount === 0 && ride.paymentType === 'free') return 'Free Ride';
    if (amount === 0) return 'No payment';
    
    const type = ride.paymentType || 'meal-swipes';
    if (type === 'meal-swipes') {
      return `${amount} meal swipe${amount > 1 ? 's' : ''}`;
    } else if (type === 'dining-dollars') {
      return `$${amount.toFixed(2)} dining dollars`;
    } else if (type === 'cash') {
      return `$${amount.toFixed(2)} cash`;
    }
    return 'Free Ride';
  };

  const handleCompleteRide = async () => {
    setCompleting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6f95a428/rides/${ride.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete ride');
      }

      setShowRating(true);
    } catch (error: any) {
      console.error('Complete ride error:', error);
      alert(error.message || 'Failed to complete ride');
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6f95a428/rides/${ride.id}/rate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify({ rating })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      onComplete?.();
      onClose();
    } catch (error: any) {
      console.error('Submit rating error:', error);
      alert(error.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ride.status === 'completed' ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                Ride Completed
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-blue-600" />
                Ride Confirmed
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {ride.status === 'completed' 
              ? 'Thank you for using Campus Rideshare!'
              : 'Your ride has been confirmed. Here are the details.'}
          </DialogDescription>
        </DialogHeader>

        {showRating ? (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <Star className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h3 className="mb-2">Rate Your Experience</h3>
              <p className="text-gray-600 mb-4">
                How was your experience with {otherPerson.name}?
              </p>
              <div className="flex justify-center mb-6">
                <Rating value={rating} onChange={setRating} size="lg" />
              </div>
              <Button 
                onClick={handleSubmitRating} 
                disabled={submittingRating || rating === 0}
                className="w-full"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Pick-up Location</p>
                    <p>{ride.pickupLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Drop-off Location</p>
                    <p>{ride.dropoffLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p>{formatDate(ride.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p>{formatTime(ride.time)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {otherPerson.role} Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p>{otherPerson.name}</p>
                </div>
                {otherPerson.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <a href={`tel:${otherPerson.phone}`} className="text-blue-600 hover:underline">
                      {otherPerson.phone}
                    </a>
                  </div>
                )}
                {otherPerson.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a href={`mailto:${otherPerson.email}`} className="text-blue-600 hover:underline">
                      {otherPerson.email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {getPaymentLabel()}
                </Badge>
                {ride.paymentType === 'free' && (
                  <p className="text-sm text-gray-600 mt-2">
                    This is a free ride - no payment required
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {ride.status === 'claimed' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-3">
                  Once the ride is complete, click the button below to mark it as completed.
                </p>
                <Button 
                  onClick={handleCompleteRide} 
                  disabled={completing}
                  className="w-full"
                >
                  {completing ? 'Completing...' : 'Mark Ride as Completed'}
                </Button>
              </div>
            )}

            {ride.status === 'completed' && !ride.rated && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-3">
                  Please rate your experience with {otherPerson.name}
                </p>
                <Button 
                  onClick={() => setShowRating(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Rate Now
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
