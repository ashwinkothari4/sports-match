-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    elo INTEGER DEFAULT 1200,
    playstyle VARCHAR(20) CHECK (playstyle IN ('competitive', 'casual', 'friendly')),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'play_plus', 'elite')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    availability JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courts table
CREATE TABLE courts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    outdoor BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sport VARCHAR(20) DEFAULT 'basketball' CHECK (sport = 'basketball'),
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'expired')),
    midpoint_location GEOGRAPHY(POINT, 4326),
    match_score JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasons table
CREATE TABLE seasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match History table
CREATE TABLE match_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user1_elo_before INTEGER NOT NULL,
    user1_elo_after INTEGER NOT NULL,
    user2_elo_before INTEGER NOT NULL,
    user2_elo_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    requirement_type VARCHAR(20) CHECK (requirement_type IN ('wins', 'elo', 'matches', 'streak')),
    requirement_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements table
CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Friends table
CREATE TABLE friends (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_elo ON users(elo);
CREATE INDEX idx_users_location ON users USING GIST((ST_SetSRID(ST_MakePoint(0, 0), 4326)));
CREATE INDEX idx_matches_creator_id ON matches(creator_id);
CREATE INDEX idx_matches_opponent_id ON matches(opponent_id);
CREATE INDEX idx_matches_scheduled_time ON matches(scheduled_time);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_location ON matches USING GIST(midpoint_location);
CREATE INDEX idx_match_history_user1_id ON match_history(user1_id);
CREATE INDEX idx_match_history_user2_id ON match_history(user2_id);
CREATE INDEX idx_match_history_created_at ON match_history(created_at);
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);
CREATE INDEX idx_courts_location ON courts USING GIST(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Users can create matches" ON matches
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Match participants can update matches" ON matches
    FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = opponent_id);

-- Courts policies
CREATE POLICY "Anyone can view courts" ON courts
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify courts" ON courts
    FOR ALL USING (auth.jwt() ->> 'email' = 'admin@sportsmatch.com');

-- Match History policies
CREATE POLICY "Anyone can view match history" ON match_history
    FOR SELECT USING (true);

CREATE POLICY "Only system can insert match history" ON match_history
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Friends policies
CREATE POLICY "Users can view their friends" ON friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their friend relationships" ON friends
    FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
    ('First Win', 'Win your first match', '🏆', 'wins', 1),
    ('Rookie', 'Play 10 matches', '🎯', 'matches', 10),
    ('Veteran', 'Play 50 matches', '⭐', 'matches', 50),
    ('Champion', 'Play 100 matches', '👑', 'matches', 100),
    ('Rising Star', 'Reach 1400 ELO', '🚀', 'elo', 1400),
    ('Expert', 'Reach 1600 ELO', '🎯', 'elo', 1600),
    ('Master', 'Reach 1800 ELO', '🏅', 'elo', 1800),
    ('Grandmaster', 'Reach 2000 ELO', '💎', 'elo', 2000),
    ('Win Streak', 'Win 5 matches in a row', '🔥', 'streak', 5),
    ('Competitor', 'Win 25 matches', '⚔️', 'wins', 25),
    ('Dominator', 'Win 100 matches', '👊', 'wins', 100);

-- Insert sample courts
INSERT INTO courts (name, latitude, longitude, outdoor, image_url) VALUES
    ('Downtown Court', 40.7128, -74.0060, true, 'https://images.unsplash.com/photo-1544919982-9b7ce4ad-4b6e?ixlib=rb-4.0.3'),
    ('Central Park Court', 40.7812, -73.9665, true, 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?ixlib=rb-4.0.3'),
    ('Sports Complex', 40.7505, -73.9934, false, 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?ixlib=rb-4.0.3');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
