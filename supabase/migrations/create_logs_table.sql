CREATE TABLE logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  service TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT,
  duration INTEGER
);

-- Enable Row Level Security if needed
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policies based on your security requirements
CREATE POLICY "Allow read access to all users" ON logs
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to authenticated users" ON logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');