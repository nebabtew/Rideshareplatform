import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Initialize Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// Sign up route
app.post('/make-server-6f95a428/signup', async (c) => {
  try {
    const { email, password, name, phone, collegeEmail } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const supabase = getSupabaseClient();
    
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone, collegeEmail },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      phone: phone || '',
      collegeEmail: collegeEmail || '',
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      user: { id: data.user.id, email, name, phone, collegeEmail } 
    });
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Signup error details:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'Failed to sign up', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get authenticated user
app.get('/make-server-6f95a428/me', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    
    return c.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || userProfile?.name,
        phone: user.user_metadata?.phone || userProfile?.phone || '',
        collegeEmail: user.user_metadata?.collegeEmail || userProfile?.collegeEmail || '',
      }
    });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Create ride request
app.post('/make-server-6f95a428/rides', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.log('Auth error while creating ride:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { pickupLocation, dropoffLocation, date, time, paymentType, paymentAmount } = await c.req.json();

    if (!pickupLocation || !dropoffLocation || !date || !time) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Get user profile for contact info
    const userProfile = await kv.get(`user:${user.id}`);

    const rideId = `ride:${Date.now()}:${user.id}`;
    const ride = {
      id: rideId,
      riderId: user.id,
      riderName: user.user_metadata?.name,
      riderPhone: user.user_metadata?.phone || userProfile?.phone || '',
      riderCollegeEmail: user.user_metadata?.collegeEmail || userProfile?.collegeEmail || '',
      pickupLocation,
      dropoffLocation,
      date,
      time,
      paymentType: paymentType || 'meal-swipes',
      paymentAmount: parseFloat(paymentAmount) || 0,
      // Keep backwards compatibility
      mealSwipes: paymentType === 'meal-swipes' ? (parseFloat(paymentAmount) || 0) : 0,
      status: 'open', // open, claimed, completed, cancelled
      createdAt: new Date().toISOString(),
      driverId: null,
      driverName: null
    };

    console.log('Creating ride:', rideId);
    await kv.set(rideId, ride);

    return c.json({ success: true, ride });
  } catch (error) {
    console.error('Create ride error:', error);
    console.error('Create ride error details:', error instanceof Error ? error.message : String(error));
    return c.json({ error: 'Failed to create ride request', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get all open rides
app.get('/make-server-6f95a428/rides', async (c) => {
  try {
    console.log('Fetching rides from KV store...');
    const rides = await kv.getByPrefix('ride:');
    console.log('Retrieved rides:', rides?.length || 0);
    
    // Filter and sort rides
    const openRides = rides
      .filter(ride => ride && ride.status === 'open')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('Open rides:', openRides.length);
    return c.json({ rides: openRides });
  } catch (error) {
    console.log('Get rides error:', error);
    console.error('Get rides error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ error: 'Failed to get rides', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Claim a ride
app.post('/make-server-6f95a428/rides/:rideId/claim', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const rideId = c.req.param('rideId');
    const ride = await kv.get(rideId);

    if (!ride) {
      return c.json({ error: 'Ride not found' }, 404);
    }

    if (ride.status !== 'open') {
      return c.json({ error: 'Ride is no longer available' }, 400);
    }

    if (ride.riderId === user.id) {
      return c.json({ error: 'You cannot claim your own ride request' }, 400);
    }

    // Update ride with driver info
    const updatedRide = {
      ...ride,
      status: 'claimed',
      driverId: user.id,
      driverName: user.user_metadata?.name,
      claimedAt: new Date().toISOString()
    };

    await kv.set(rideId, updatedRide);

    // Create transaction record for payment promise
    if (ride.paymentAmount > 0) {
      const transactionId = `transaction:${Date.now()}:${user.id}`;
      const transaction = {
        id: transactionId,
        rideId,
        riderId: ride.riderId,
        riderName: ride.riderName,
        driverId: user.id,
        driverName: user.user_metadata?.name,
        paymentType: ride.paymentType,
        paymentAmount: ride.paymentAmount,
        // Keep backwards compatibility
        mealSwipes: ride.mealSwipes,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
        date: ride.date,
        time: ride.time,
        createdAt: new Date().toISOString()
      };

      await kv.set(transactionId, transaction);
    }

    return c.json({ success: true, ride: updatedRide });
  } catch (error) {
    console.log('Claim ride error:', error);
    return c.json({ error: 'Failed to claim ride' }, 500);
  }
});

// Get user's ride history
app.get('/make-server-6f95a428/history', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all rides where user is either rider or driver
    const allRides = await kv.getByPrefix('ride:');
    const userRides = allRides
      .filter(ride => ride && (ride.riderId === user.id || ride.driverId === user.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get all transactions involving this user
    const allTransactions = await kv.getByPrefix('transaction:');
    const userTransactions = allTransactions
      .filter(tx => tx && (tx.riderId === user.id || tx.driverId === user.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ 
      rides: userRides,
      transactions: userTransactions 
    });
  } catch (error) {
    console.log('Get history error:', error);
    return c.json({ error: 'Failed to get history' }, 500);
  }
});

// Get my posted rides (for cancellation)
app.get('/make-server-6f95a428/my-rides', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allRides = await kv.getByPrefix('ride:');
    const myRides = allRides
      .filter(ride => ride && ride.riderId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ rides: myRides });
  } catch (error) {
    console.log('Get my rides error:', error);
    return c.json({ error: 'Failed to get rides' }, 500);
  }
});

Deno.serve(app.fetch);
