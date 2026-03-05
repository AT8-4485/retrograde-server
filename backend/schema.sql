-- ==========================================
-- 1. USERS
-- ==========================================
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUIDv7
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. BOOKMARKS
-- ==========================================
CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY, -- UUIDv7
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('article', 'game', 'post')),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    metadata TEXT, -- Stored as a JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster pagination and filtering by user/type
CREATE INDEX idx_bookmarks_user_type ON bookmarks(user_id, type);

-- ==========================================
-- 3. GAME RESULTS
-- ==========================================
CREATE TABLE game_results (
    id TEXT PRIMARY KEY, -- UUIDv7
    challenge_id TEXT NOT NULL,
    user_id TEXT, -- Nullable for anonymous play
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL, -- Added based on your POST body spec
    duration_ms INTEGER NOT NULL,
    rank INTEGER,
    streak INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index for querying daily leaderboards quickly
CREATE INDEX idx_game_results_challenge ON game_results(challenge_id);

-- ==========================================
-- 4. PUSH TOKENS
-- ==========================================
CREATE TABLE push_tokens (
    id TEXT PRIMARY KEY, -- UUIDv7
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL, -- The actual ExpoPushToken string
    platform TEXT, -- e.g., 'ios', 'android'
    device_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Helps with cleanup of dead tokens
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. NOTIFICATION PREFERENCES
-- ==========================================
-- Note: Extracted into its own table linked 1:1 with the User 
-- because preferences apply to the user, not just a single device token.
CREATE TABLE notification_preferences (
    user_id TEXT PRIMARY KEY,
    breaking_news BOOLEAN DEFAULT 1,
    daily_game_reminder BOOLEAN DEFAULT 1,
    weekly_digest BOOLEAN DEFAULT 1,
    editorial_posts BOOLEAN DEFAULT 1,
    quiet_hours TEXT, -- Stored as JSON or a string like "22:00-07:00"
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);