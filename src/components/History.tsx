import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MapPin, Calendar, Clock, DollarSign, User, Car, UserCheck } from 'lucide-react';

interface HistoryProps {
  user: any;
}

export function History({ user }: HistoryProps) {
  const [rides, setRides] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6f95a428/history`,
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      setRides(data.rides);
      setTransactions(data.transactions);
    } catch (err: any) {
      console.error('Fetch history error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
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

  const getPaymentLabel = (item: any) => {
    const amount = item.paymentAmount || 0;
    if (amount === 0) return null;
    
    const type = item.paymentType || 'meal-swipes';
    if (type === 'meal-swipes') {
      return `${amount} meal swipe${amount > 1 ? 's' : ''}`;
    } else if (type === 'dining-dollars') {
      return `$${amount.toFixed(2)} dining dollars`;
    } else {
      return `$${amount.toFixed(2)} cash`;
    }
  };

  const getPaymentIcon = (item: any) => {
    const type = item.paymentType || 'meal-swipes';
    return type === 'meal-swipes' ? '🍽️' : type === 'dining-dollars' ? '💳' : '💵';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      open: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      claimed: { variant: 'secondary', className: 'bg-green-100 text-green-800' },
      completed: { variant: 'secondary', className: 'bg-blue-100 text-blue-800' },
      cancelled: { variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
    };

    const config = variants[status] || variants.open;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading history...</p>
      </div>
    );
  }

  const ridesRequested = rides.filter(r => r.riderId === user.id);
  const ridesProvided = rides.filter(r => r.driverId === user.id);
  const paymentsOwed = transactions.filter(t => t.riderId === user.id);
  const paymentsEarned = transactions.filter(t => t.driverId === user.id);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl">Your History</h2>
        <p className="text-gray-600">Track your rides and payment promises</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue="rides" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rides">
            <Car className="w-4 h-4 mr-2" />
            Rides
          </TabsTrigger>
          <TabsTrigger value="payments">
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rides" className="space-y-4 mt-6">
          <div>
            <h3 className="text-lg mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Rides You Requested ({ridesRequested.length})
            </h3>
            {ridesRequested.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No ride requests yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {ridesRequested.map((ride) => (
                  <Card key={ride.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {ride.pickupLocation} → {ride.dropoffLocation}
                        </CardTitle>
                        {getStatusBadge(ride.status)}
                      </div>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(ride.date)} at {formatTime(ride.time)}
                        </div>
                        {ride.driverName && (
                          <div className="flex items-center gap-2 text-green-600">
                            <UserCheck className="w-3 h-3" />
                            Driver: {ride.driverName}
                          </div>
                        )}
                        {getPaymentLabel(ride) && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <span>{getPaymentIcon(ride)}</span>
                            Offered {getPaymentLabel(ride)}
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <h3 className="text-lg mb-3 flex items-center gap-2">
              <Car className="w-5 h-5 text-green-600" />
              Rides You Provided ({ridesProvided.length})
            </h3>
            {ridesProvided.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No rides provided yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {ridesProvided.map((ride) => (
                  <Card key={ride.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {ride.pickupLocation} → {ride.dropoffLocation}
                        </CardTitle>
                        {getStatusBadge(ride.status)}
                      </div>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(ride.date)} at {formatTime(ride.time)}
                        </div>
                        <div className="flex items-center gap-2 text-indigo-600">
                          <User className="w-3 h-3" />
                          Rider: {ride.riderName}
                        </div>
                        {getPaymentLabel(ride) && (
                          <div className="flex items-center gap-2 text-green-600">
                            <span>{getPaymentIcon(ride)}</span>
                            Earned {getPaymentLabel(ride)}
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 mt-6">
          <div>
            <h3 className="text-lg mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              Payments You Owe ({paymentsOwed.length})
            </h3>
            {paymentsOwed.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No payment promises
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {paymentsOwed.map((tx) => (
                  <Card key={tx.id} className="border-orange-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>You owe {tx.driverName}</span>
                        <Badge className="bg-orange-100 text-orange-800">
                          {getPaymentIcon(tx)} {getPaymentLabel(tx)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div>Ride: {tx.pickupLocation} → {tx.dropoffLocation}</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(tx.date)} at {formatTime(tx.time)}
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <h3 className="text-lg mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Payments You're Owed ({paymentsEarned.length})
            </h3>
            {paymentsEarned.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No payments earned yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {paymentsEarned.map((tx) => (
                  <Card key={tx.id} className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{tx.riderName} owes you</span>
                        <Badge className="bg-green-100 text-green-800">
                          {getPaymentIcon(tx)} {getPaymentLabel(tx)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div>Ride: {tx.pickupLocation} → {tx.dropoffLocation}</div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(tx.date)} at {formatTime(tx.time)}
                        </div>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {transactions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-800">
                <strong>Integrity Note:</strong> All payment promises are permanently recorded here to ensure accountability between students.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
