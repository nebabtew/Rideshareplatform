import { useState } from 'react';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Calendar, Clock, DollarSign } from 'lucide-react';

interface PostRideProps {
  user: any;
}

export function PostRide({ user }: PostRideProps) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentType, setPaymentType] = useState('meal-swipes');
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6f95a428/rides`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify({
            pickupLocation,
            dropoffLocation,
            date,
            time,
            paymentType,
            paymentAmount: parseFloat(paymentAmount) || 0
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post ride request');
      }

      setSuccess(true);
      // Reset form
      setPickupLocation('');
      setDropoffLocation('');
      setDate('');
      setTime('');
      setPaymentType('meal-swipes');
      setPaymentAmount('0');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Post ride error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Request a Ride</CardTitle>
        <CardDescription>
          Post where you need to go and offer payment to drivers who can help
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pickup">
              <MapPin className="w-4 h-4 inline mr-2" />
              Pick-up Location
            </Label>
            <Input
              id="pickup"
              type="text"
              placeholder="e.g., Main Library"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoff">
              <MapPin className="w-4 h-4 inline mr-2" />
              Drop-off Location
            </Label>
            <Input
              id="dropoff"
              type="text"
              placeholder="e.g., Airport, Downtown, etc."
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                <Clock className="w-4 h-4 inline mr-2" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentType">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Payment Type
            </Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger id="paymentType">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meal-swipes">Meal Swipes</SelectItem>
                <SelectItem value="dining-dollars">Dining Dollars</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentAmount">
              {paymentType === 'meal-swipes' ? 'Number of Meal Swipes' : 
               paymentType === 'dining-dollars' ? 'Dining Dollars ($)' : 
               'Cash Amount ($)'} (optional)
            </Label>
            <Input
              id="paymentAmount"
              type="number"
              min="0"
              step={paymentType === 'meal-swipes' ? '1' : '0.01'}
              placeholder="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              {paymentType === 'meal-swipes' ? 
                'Offer meal swipes as payment. This creates a tracked promise for integrity.' :
                'Specify the amount you\'re offering as payment for the ride.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Ride request posted successfully! Check the Browse Rides tab.
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Posting...' : 'Post Ride Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
